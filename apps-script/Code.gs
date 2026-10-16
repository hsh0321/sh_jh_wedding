const SPREADSHEET_ID = '1Dz7fbz0WwYTFK7r1HNpgBERv_w7otemAGclzTVKAo34';
const SHEET_NAME = '참석여부';
const HEADERS = ['요청 ID', '접수 시각', '성함', '구분', '참석 여부', '본인 포함 인원', '식사 여부', '메시지', '수집 동의', '동의문 버전'];

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function valid_(p) {
  return validRequestId_(p.requestId) &&
    typeof p.guestName === 'string' && p.guestName.trim().length >= 1 && p.guestName.trim().length <= 40 &&
    !/[\u0000-\u001f\u007f]/.test(p.guestName) &&
    ['groom', 'bride'].includes(p.side) && ['yes', 'no'].includes(p.attendance) &&
    (p.attendance === 'yes'
      ? /^(?:[1-9]|1[0-9]|20)$/.test(p.guests || '') && ['yes', 'no', 'unknown'].includes(p.meal)
      : p.guests === '0' && p.meal === 'none') &&
    typeof p.message === 'string' && p.message.length <= 300 &&
    p.consent === 'yes' && p.consentVersion === '2026-10-14';
}

function validRequestId_(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '');
}

// Treat user text as literal cells, including formula-looking input.
function cell_(value) {
  return /^[\s]*[=+@-]/.test(value) ? "'" + value : value;
}

function sheet_() {
  const book = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  const headers = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (headers.join('|') !== HEADERS.join('|')) throw new Error('Unexpected sheet columns');
  return sheet;
}

// Run once in the editor to authorize access and verify the Spreadsheet ID.
function setup() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { sheet_(); } finally { lock.releaseLock(); }
}

function doPost(e) {
  const p = e && e.parameter || {};
  const cancelling = p.action === 'cancel';
  if (!e || e.contentLength > 8000 || (cancelling ? !validRequestId_(p.requestId) : !valid_(p))) {
    return json_({ ok: false, code: 'INVALID_INPUT' });
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return json_({ ok: false, code: 'BUSY' });
  try {
    const sheet = sheet_();
    const lastRow = sheet.getLastRow();
    if (cancelling) {
      let deleted = false;
      if (lastRow > 1) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        const index = ids.findIndex(row => row[0] === p.requestId);
        if (index >= 0) { sheet.deleteRow(index + 2); deleted = true; }
      }
      SpreadsheetApp.flush();
      return json_({ ok: true, cancelled: true, deleted: deleted, requestId: p.requestId });
    }
    // The durable request ID is checked and written under the same lock.
    // A retry after a timeout or a simultaneous click cannot append a second row.
    if (lastRow > 1 && sheet.getRange(2, 1, lastRow - 1, 1).createTextFinder(p.requestId).matchEntireCell(true).findNext()) {
      return json_({ ok: true, duplicate: true, requestId: p.requestId });
    }
    sheet.appendRow([
      p.requestId, new Date(), cell_(p.guestName.trim()),
      p.side === 'groom' ? '신랑 측' : '신부 측',
      p.attendance === 'yes' ? '참석' : '불참', Number(p.guests),
      ({ yes: '식사 예정', no: '식사 안 함', unknown: '미정', none: '해당 없음' })[p.meal],
      cell_(p.message.trim()), '동의', p.consentVersion
    ]);
    SpreadsheetApp.flush();
    return json_({ ok: true, duplicate: false, requestId: p.requestId });
  } catch (error) {
    // Do not return spreadsheet details or personal data to the public endpoint.
    return json_({ ok: false, code: 'SAVE_FAILED' });
  } finally {
    lock.releaseLock();
  }
}
