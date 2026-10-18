'use strict';
(() => {
  const section = document.getElementById('rsvp');
  const float = document.getElementById('rsvp-float');
  const prompt = document.getElementById('rsvp-prompt');
  const modal = document.getElementById('rsvp-modal');
  if (!section || !float || !prompt || !modal) return;
  const status = document.getElementById('rsvp-status');
  const mount = document.getElementById('rsvp-modal-mount');
  const invitation = document.querySelector('section.invitation');
  const slot = document.createElement('div');
  section.before(slot);
  const seenKey = 'sh-jh-rsvp-prompt-v1';
  let seen = false, opener = null, savedOverflow = '', savedSlotHeight = '', queued = false, closing = false;
  try { seen = sessionStorage.getItem(seenKey) === '1'; } catch {}
  function completed() { return status.dataset.state === 'success'; }
  function remember() { seen = true; try { sessionStorage.setItem(seenKey, '1'); } catch {} }
  function lock() { savedOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden'; }
  function unlock() { document.documentElement.style.overflow = savedOverflow; }
  function paint() {
    queued = false;
    const rect = (modal.open ? slot : section).getBoundingClientRect();
    const sectionVisible = rect.top < innerHeight && rect.bottom > 0;
    const deep = invitation && invitation.getBoundingClientRect().top <= innerHeight * .45;
    float.setAttribute('aria-label', completed() ? '참석 회신 확인 및 취소' : '참석 여부 알려주기');
    float.hidden = prompt.open || modal.open || !deep || sectionVisible;
    if (!seen && deep && !sectionVisible && !completed() && !modal.open && !prompt.open) {
      remember(); opener = document.activeElement; lock(); prompt.showModal();
      prompt.focus({ preventScroll: true }); float.hidden = true;
    }
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(paint); } }
  function openForm() {
    if (modal.open) return;
    remember();
    if (prompt.open) { prompt.close(); unlock(); }
    opener = document.activeElement;
    savedSlotHeight = slot.style.height;
    slot.style.height = `${section.getBoundingClientRect().height}px`;
    mount.append(section);
    lock(); modal.showModal();
    float.hidden = true;
    // Keep the keyboard closed until the guest taps the name field.
    modal.focus({ preventScroll: true });
  }
  function closeForm() {
    if (!modal.open || closing) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { modal.close(); return; }
    closing = true;
    modal.classList.add('is-closing');
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      modal.classList.remove('is-closing');
      closing = false;
      modal.close();
    };
    modal.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, 340);
  }
  modal.addEventListener('close', () => {
    slot.after(section); slot.style.height = savedSlotHeight;
    unlock(); paint();
    if (opener && opener.isConnected && !opener.hidden) opener.focus({ preventScroll: true });
  });
  prompt.addEventListener('close', () => { if (!modal.open) { unlock(); schedule(); } });
  prompt.querySelector('[data-prompt-close]').addEventListener('click', () => prompt.close());
  document.getElementById('rsvp-prompt-confirm').addEventListener('click', openForm);
  document.getElementById('rsvp-modal-close').addEventListener('click', closeForm);
  modal.addEventListener('cancel', event => { event.preventDefault(); closeForm(); });
  [prompt, modal].forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) {
      if (dialog === modal) closeForm(); else dialog.close();
    }
  }));
  // A drag repositions the envelope; an ordinary click opens the form.
  let drag = null, suppressClick = false;
  float.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const r = float.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: r.left, top: r.top, moved: false };
    float.setPointerCapture(event.pointerId);
  });
  function place(left, top) {
    float.style.left = `${Math.max(16, Math.min(innerWidth - 60, left))}px`;
    float.style.top = `${Math.max(16, Math.min(innerHeight - 68, top))}px`;
    float.style.right = float.style.bottom = 'auto';
  }
  float.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (Math.hypot(dx, dy) > 6) drag.moved = true;
    if (drag.moved) place(drag.left + dx, drag.top + dy);
  });
  function endDrag(event) {
    if (!drag || drag.id !== event.pointerId) return;
    suppressClick = drag.moved;
    if (drag.moved) {
      const r = float.getBoundingClientRect();
      place(r.left + r.width / 2 < innerWidth / 2 ? 16 : innerWidth - 60, r.top);
    }
    drag = null;
  }
  float.addEventListener('pointerup', endDrag);
  float.addEventListener('pointercancel', endDrag);
  float.addEventListener('click', () => { if (suppressClick) { suppressClick = false; return; } openForm(); });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => {
    if (float.style.left) { const r = float.getBoundingClientRect(); place(r.left, r.top); }
    schedule();
  });
  new MutationObserver(() => {
    if (completed()) {
      if (prompt.open) prompt.close();
    }
    schedule();
  }).observe(status, { attributes: true, attributeFilter: ['data-state'] });
  paint();
})();
