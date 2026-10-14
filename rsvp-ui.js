'use strict';
(() => {
  const form = document.querySelector('#rsvp-form');
  if (!form) return;
  const $ = id => document.getElementById(id);
  const one = $('rsvp-step-one'), two = $('rsvp-step-two');
  const next = $('rsvp-next'), back = $('rsvp-back');
  const send = form.querySelector('[type="submit"]');
  const status = $('rsvp-status');
  const choices = {
    side: [['groom', '신랑측'], ['bride', '신부측']],
    attendance: [['yes', '참석할게요'], ['no', '마음으로 함께할게요']],
    bus: [['yes', '탑승할게요'], ['no', '탑승하지 않아요']]
  };
  let step = 1, bus = '', busCount = 1;
  const ready = () => form.elements.guestName.value.trim() && form.elements.side.value && form.elements.attendance.value;
  function sync() {
    next.disabled = !ready();
    const count = Number(form.elements.guests.value);
    busCount = Math.min(busCount, count);
    $('rsvp-count').textContent = count;
    $('rsvp-bus-count').textContent = busCount;
    $('rsvp-minus').disabled = count <= 1;
    $('rsvp-plus').disabled = count >= 20;
    $('bus-minus').disabled = busCount <= 1;
    $('bus-plus').disabled = busCount >= count;
    $('rsvp-bus-count-row').hidden = bus !== 'yes';
    if (!form.hasAttribute('aria-busy') && status.dataset.state !== 'success') {
      send.disabled = !form.elements.consent.checked || (form.elements.attendance.value === 'yes' && !bus);
    }
    form.elements.message.value = form.elements.attendance.value !== 'yes' ? '' :
      bus === 'yes' ? `전세버스: 탑승 / ${busCount}명` : bus === 'no' ? '전세버스: 미탑승' : '';
  }
  function showStep(value) {
    step = value;
    const attending = form.elements.attendance.value === 'yes';
    one.hidden = step !== 1;
    two.hidden = step !== 2;
    next.hidden = step !== 1;
    back.hidden = send.hidden = step !== 2;
    $('rsvp-bus-rows').hidden = !attending;
    $('rsvp-intro').hidden = step === 2;
    $('rsvp-step-title').textContent = step === 1 ? '참석 여부' : attending ? '전세버스 탑승 여부' : '회신 보내기';
    status.textContent = '';
    status.dataset.state = '';
    sync();
    const target = step === 1 ? $('rsvp-name') : attending ? $('bus-choice') : form.elements.consent;
    target.focus({ preventScroll: true });
  }
  form.querySelectorAll('[data-cycle]').forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.cycle;
      const current = key === 'bus' ? bus : form.elements[key].value;
      const options = choices[key];
      const value = options[(options.findIndex(option => option[0] === current) + 1) % options.length];
      if (key === 'bus') bus = value[0];
      else {
        form.elements[key].value = value[0];
        form.elements[key].dispatchEvent(new Event('change', { bubbles: true }));
      }
      button.textContent = value[1];
      next.textContent = form.elements.attendance.value === 'no' ? '다음 · 회신 확인' : '다음 · 전세버스';
      sync();
    });
  });
  [['rsvp-minus', -1], ['rsvp-plus', 1]].forEach(([id, delta]) => {
    $(id).addEventListener('click', () => {
      form.elements.guests.value = Math.max(1, Math.min(20, Number(form.elements.guests.value) + delta));
      sync();
    });
  });
  [['bus-minus', -1], ['bus-plus', 1]].forEach(([id, delta]) => {
    $(id).addEventListener('click', () => { busCount = Math.max(1, Math.min(Number(form.elements.guests.value), busCount + delta)); sync(); });
  });
  form.addEventListener('input', sync);
  next.addEventListener('click', () => { if (ready()) showStep(2); });
  back.addEventListener('click', () => showStep(1));
  form.addEventListener('submit', event => {
    if (step === 1 || !ready() || send.disabled) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (step === 1 && ready()) showStep(2);
    }
  }, true);
  function reflectStatus() {
    const done = status.dataset.state === 'success';
    $('rsvp-fields').hidden = done;
    form.querySelector('.rsvp-footer').hidden = done;
    back.disabled = form.hasAttribute('aria-busy');
    if (!form.hasAttribute('aria-busy') && !done) send.textContent = '회신 보내기';
    sync();
  }
  new MutationObserver(reflectStatus).observe(status, { childList: true, attributes: true, attributeFilter: ['data-state'] });
  new MutationObserver(reflectStatus).observe(form, { attributes: true, attributeFilter: ['aria-busy'] });
  reflectStatus();
})();
