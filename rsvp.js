'use strict';
(() => {
  const form = document.querySelector('#rsvp-form');
  if (!form) return;
  const fields = form.querySelector('#rsvp-fields');
  const attendance = form.elements.attendance;
  const attendingFields = form.querySelector('#rsvp-attending');
  const status = document.querySelector('#rsvp-status');
  const button = form.querySelector('[type="submit"]');
  const config = window.WEDDING_RSVP || {};
  const key = 'sh-jh-rsvp-20270117-v1';
  let busy = false;
  let completed = false;
  let memoryId;
  function readState() {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
  }
  function saveState(value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private mode: server still deduplicates this session. */ }
  }
  function show(message, state = '') {
    status.textContent = message;
    status.dataset.state = state;
  }
  function finish() {
    completed = true;
    fields.disabled = true;
    button.disabled = true;
    button.textContent = '회신 완료';
    show('참석 여부가 전달되었습니다. 함께해 주시는 마음에 감사드려요. 변경은 신랑·신부에게 직접 알려주세요.', 'success');
  }
  function syncAttendance() {
    const attending = attendance.value === 'yes';
    attendingFields.hidden = !attending;
    attendingFields.disabled = !attending;
  }
  attendance.addEventListener('change', syncAttendance);
  syncAttendance();
  if (readState().done) finish();
  window.addEventListener('storage', event => {
    if (event.key === key && readState().done) finish();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || completed) return;
    if (readState().done) { finish(); return; }
    const name = form.elements.guestName;
    name.value = name.value.trim();
    if (!form.reportValidity()) return;
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(config.endpoint || '')) {
      show('현재 온라인 회신을 준비 중입니다. 신랑·신부에게 직접 참석 여부를 알려주세요.', 'error');
      return;
    }
    // Persist only an opaque request ID, never guests' names or other form values.
    memoryId = readState().requestId || memoryId || crypto.randomUUID();
    saveState({ requestId: memoryId, done: false });
    const attending = attendance.value === 'yes';
    const payload = {
      requestId: memoryId,
      guestName: name.value,
      side: form.elements.side.value,
      attendance: attendance.value,
      guests: attending ? form.elements.guests.value : '0',
      meal: attending ? form.elements.meal.value : 'none',
      message: form.elements.message.value.trim(),
      consent: 'yes',
      consentVersion: '2026-10-14'
    };
    busy = true;
    fields.disabled = true;
    button.disabled = true;
    button.textContent = '전달하는 중…';
    form.setAttribute('aria-busy', 'true');
    show('참석 여부를 전달하고 있습니다. 잠시만 기다려 주세요.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs || 20000);
    try {
      // A simple form POST avoids preflight; readable JSON is required for success.
      const response = await fetch(config.endpoint, {
        method: 'POST', body: new URLSearchParams(payload),
        credentials: 'omit', redirect: 'follow', signal: controller.signal
      });
      if (!response.ok) throw new Error('http');
      const result = await response.json();
      if (result.ok !== true || result.requestId !== memoryId) throw new Error('save');
      saveState({ requestId: memoryId, done: true });
      finish();
    } catch {
      if (!completed) show('저장 완료를 확인하지 못했습니다. 연결을 확인한 뒤 다시 눌러 주세요. 같은 요청은 중복 저장되지 않습니다. 계속 실패하면 신랑·신부에게 알려주세요.', 'error');
    } finally {
      clearTimeout(timer);
      busy = false;
      form.removeAttribute('aria-busy');
      if (!completed) {
        fields.disabled = false;
        syncAttendance();
        button.disabled = false;
        button.textContent = '참석 여부 전달하기';
      }
    }
  });
})();
