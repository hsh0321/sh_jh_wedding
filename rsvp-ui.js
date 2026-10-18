'use strict';
(() => {
  const form = document.querySelector('#rsvp-form');
  if (!form) return;
  const $ = id => document.getElementById(id);
  const one = $('rsvp-step-one');
  const send = form.querySelector('[type="submit"]');
  const status = $('rsvp-status');
  const choices = {
    side: [['groom', '신랑측'], ['bride', '신부측']],
    attendance: [['yes', '참석할게요'], ['no', '마음으로 함께할게요']]
  };
  const ready = () => Boolean(form.elements.guestName.value.trim() && form.elements.side.value && form.elements.attendance.value);

  function sync() {
    const count = Number(form.elements.guests.value);
    $('rsvp-count').textContent = count;
    $('rsvp-minus').disabled = count <= 1;
    $('rsvp-plus').disabled = count >= 20;
    if (!form.hasAttribute('aria-busy') && status.dataset.state !== 'success') send.disabled = !ready();
    form.elements.message.value = '';
    form.querySelectorAll('[data-choice]').forEach(button => {
      const key = button.dataset.choice;
      button.setAttribute('aria-pressed', String(button.dataset.value === form.elements[key].value));
    });
  }

  form.querySelectorAll('[data-cycle]').forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.cycle;
      const current = form.elements[key].value;
      const options = choices[key];
      const value = options[(options.findIndex(option => option[0] === current) + 1) % options.length];
      form.elements[key].value = value[0];
      form.elements[key].dispatchEvent(new Event('change', { bubbles: true }));
      button.textContent = value[1];
      sync();
    });
  });

  // The modal uses direct choices; the inline form keeps its cycling controls.
  [['attendance', '참석 여부', ['참석', '불참석']], ['side', '어느 측 하객이신가요?', ['신랑 측', '신부 측']]].forEach(([key, title, labels]) => {
    const group = document.createElement('div');
    group.className = 'rsvp-modal-choices';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', title);
    if (key !== 'attendance') {
      const label = document.createElement('p'); label.textContent = title; group.append(label);
    }
    const buttons = document.createElement('div');
    choices[key].forEach(([value], index) => {
      const button = document.createElement('button'); button.type = 'button';
      button.dataset.choice = key; button.dataset.value = value; button.textContent = labels[index];
      button.addEventListener('click', () => {
        if (form.elements[key].value !== value) {
          const cycle = form.querySelector(`[data-cycle="${key}"]`);
          cycle.click();
          if (form.elements[key].value !== value) cycle.click();
        }
      });
      buttons.append(button);
    });
    group.append(buttons);
    one.insertBefore(group, $('rsvp-attending'));
  });

  [['rsvp-minus', -1], ['rsvp-plus', 1]].forEach(([id, delta]) => {
    $(id).addEventListener('click', () => {
      form.elements.guests.value = Math.max(1, Math.min(20, Number(form.elements.guests.value) + delta));
      sync();
    });
  });
  form.addEventListener('input', sync);
  form.addEventListener('submit', event => {
    if (!ready() || send.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
      $('rsvp-name').focus({ preventScroll: true });
    }
  }, true);

  function reflectStatus() {
    const done = status.dataset.state === 'success';
    $('rsvp-fields').hidden = done;
    form.querySelector('.rsvp-footer').hidden = done;
    if (!form.hasAttribute('aria-busy') && !done) send.textContent = '참석 여부 전달하기';
    sync();
  }
  new MutationObserver(reflectStatus).observe(status, { childList: true, attributes: true, attributeFilter: ['data-state'] });
  new MutationObserver(reflectStatus).observe(form, { attributes: true, attributeFilter: ['aria-busy'] });
  reflectStatus();
})();
