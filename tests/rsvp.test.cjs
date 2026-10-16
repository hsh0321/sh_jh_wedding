const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const id = '12345678-1234-4123-8123-123456789abc';
const data = () => ({ requestId: id, guestName: '테스트', side: 'groom', attendance: 'yes', guests: '2', meal: 'yes', message: '', consent: 'yes', consentVersion: '2026-10-14' });
function server() {
  const rows = [];
  let locked = false;
  const sheet = {
    getLastRow: () => rows.length,
    appendRow: row => { assert.ok(locked); rows.push(row); },
    deleteRow: row => { assert.ok(locked); rows.splice(row - 1, 1); },
    setFrozenRows() {},
    getRange(start, col, count) {
      return {
        getValues: () => rows.slice(start - 1, start - 1 + count),
        createTextFinder(value) { return { matchEntireCell() { return this; }, findNext: () => rows.slice(1).find(row => row[0] === value) || null }; }
      };
    }
  };
  const context = vm.createContext({
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }), flush() {} },
    LockService: { getScriptLock: () => ({ tryLock() { locked = true; return true; }, releaseLock() { locked = false; } }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) }
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'apps-script/Code.gs'), 'utf8'), context);
  return { context, rows, post: p => context.doPost({ parameter: p, contentLength: 300 }) };
}
test('server validates consent, enums, count, name, message and absent semantics', () => {
  const s = server();
  for (const patch of [{ consent: 'no' }, { side: 'x' }, { guests: '0' }, { guests: '21' }, { guests: '1.5' }, { guestName: '  ' }, { guestName: 'x'.repeat(41) }, { message: 'x'.repeat(301) }, { requestId: 'bad' }, { attendance: 'no' }, { meal: '' }]) {
    assert.equal(s.post({ ...data(), ...patch }).ok, false);
  }
  assert.equal(s.rows.length, 0);
  assert.equal(s.post({ ...data(), attendance: 'no', guests: '0', meal: 'none' }).ok, true);
  assert.equal(s.rows[1][5], 0);
});
test('server saves once across retries and escapes formula input', () => {
  const s = server();
  const p = { ...data(), guestName: '=1+1', message: '  =IMPORTXML("x")' };
  assert.equal(s.post(p).duplicate, false);
  assert.equal(s.post(p).duplicate, true);
  assert.equal(s.rows.length, 2);
  assert.equal(s.rows[1][2], "'=1+1");
  assert.equal(s.rows[1][7], "'=IMPORTXML(\"x\")");
});
test('server cancellation removes the matching response and is idempotent', () => {
  const s = server();
  assert.equal(s.post(data()).ok, true);
  assert.equal(s.rows.length, 2);
  const cancelled = s.post({ action: 'cancel', requestId: id });
  assert.equal(cancelled.cancelled, true);
  assert.equal(cancelled.deleted, true);
  assert.equal(s.rows.length, 1);
  assert.equal(s.post({ action: 'cancel', requestId: id }).cancelled, true);
});
test('server reports write failure without claiming success', () => {
  const s = server();
  s.context.SpreadsheetApp.openById = () => { throw Error('private error'); };
  assert.equal(s.post(data()).code, 'SAVE_FAILED');
});
function client(fetch, endpoint = 'https://script.google.com/macros/s/test/exec', initial = {}) {
  const elements = Object.fromEntries(Object.entries(data()).map(([key, value]) => [key, { value }]));
  elements.attendance.addEventListener = () => {};
  const fields = {}, attending = {}, status = { dataset: {} }, button = {}, cancel = { hidden: true, addEventListener(type, fn) { this.click = fn; } };
  const storage = { value: JSON.stringify(initial), getItem() { return this.value; }, setItem(k, v) { this.value = v; }, removeItem() { this.value = null; } };
  let submit;
  let valid = true;
  const document = { cookie: '', querySelector: s => s === '#rsvp-form' ? form : status };
  const form = { elements, querySelector: s => ({ '#rsvp-fields': fields, '#rsvp-attending': attending, '[type="submit"]': button, '#rsvp-cancel': cancel })[s], reportValidity: () => valid, addEventListener: (type, fn) => { submit = fn; }, setAttribute() {}, removeAttribute() {} };
  document.querySelector = s => s === '#rsvp-form' ? form : status;
  const context = vm.createContext({ document, window: { WEDDING_RSVP: { endpoint }, addEventListener() {}, confirm: () => true }, localStorage: storage, crypto: { randomUUID: () => id }, URLSearchParams, AbortController, setTimeout, clearTimeout, fetch });
  vm.runInContext(fs.readFileSync(path.join(root, 'rsvp.js'), 'utf8'), context);
  return { submit: () => submit({ preventDefault() {} }), cancel: () => cancel.click(), cancelButton: cancel, status, button, fields, elements, storage, document, invalidate: () => { valid = false; } };
}
test('client refuses invalid form and missing endpoint', async () => {
  let calls = 0;
  const c = client(() => calls++, '');
  c.invalidate(); await c.submit(); assert.equal(calls, 0);
  const d = client(() => calls++, ''); await d.submit();
  assert.equal(d.status.dataset.state, 'error'); assert.equal(calls, 0);
});
test('client prevents double click and accepts only confirmed server success', async () => {
  let resolve, calls = 0;
  const c = client(() => { calls++; return new Promise(r => { resolve = r; }); });
  const pending = c.submit(); await c.submit(); assert.equal(calls, 1);
  resolve({ ok: true, json: async () => ({ ok: true, requestId: id }) });
  await pending;
  assert.equal(c.status.dataset.state, 'success'); assert.equal(c.button.disabled, true);
  assert.equal(JSON.parse(c.storage.value).done, true);
  assert.match(c.document.cookie, /sh_jh_rsvp_done=12345678-/);
  assert.ok(!c.storage.value.includes('테스트'));
  await c.submit(); assert.equal(calls, 1);
});
test('client preserves input and request ID across network failure/retry', async () => {
  const requests = [];
  const c = client(async (url, options) => {
    requests.push(options.body.get('requestId'));
    if (requests.length === 1) throw Error('network');
    return { ok: true, json: async () => ({ ok: true, duplicate: true, requestId: id }) };
  });
  await c.submit(); assert.equal(c.status.dataset.state, 'error'); assert.equal(c.button.disabled, false);
  assert.equal(c.elements.guestName.value, '테스트');
  await c.submit(); assert.deepEqual(requests, [id, id]); assert.equal(c.status.dataset.state, 'success');
});
test('client rejects opaque, malformed and negative responses', async () => {
  for (const response of [{ ok: false }, { ok: true, json: async () => { throw Error('html'); } }, { ok: true, json: async () => ({ ok: false }) }, { ok: true, json: async () => ({ ok: true, requestId: 'wrong' }) }]) {
    const c = client(async () => response); await c.submit(); assert.equal(c.status.dataset.state, 'error');
  }
});
test('client restores completion without sending again', async () => {
  const c = client(() => { throw Error('must not send'); }, undefined, { requestId: id, done: true });
  await c.submit(); assert.equal(c.status.dataset.state, 'success'); assert.equal(c.fields.disabled, true);
});
test('client cancellation removes completion state and allows another reply', async () => {
  let calls = 0;
  const c = client(async (url, options) => {
    calls++;
    if (options.body.get('action') === 'cancel') return { ok: true, json: async () => ({ ok: true, cancelled: true, requestId: id }) };
    return { ok: true, json: async () => ({ ok: true, requestId: id }) };
  });
  await c.submit();
  await c.cancel();
  assert.equal(c.status.dataset.state, 'cancelled');
  assert.equal(c.storage.value, null);
  assert.equal(c.cancelButton.hidden, true);
  await c.submit();
  assert.equal(calls, 3);
});
test('generated page matches source and includes RSVP once', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.equal(html, fs.readFileSync(path.join(root, 'src/index.template.html'), 'utf8'));
  assert.equal((html.match(/id="rsvp-form"/g) || []).length, 1);
});
