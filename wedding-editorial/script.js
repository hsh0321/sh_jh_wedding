'use strict';
const $ = (selector) => document.querySelector(selector);
const photos = [1, 3, 4, 5, 6, 7, 8, 9, 10];
let photoIndex = 0;
let toastTimer;
function notify(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3200); }
async function copyText(text, label) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const field = document.createElement('textarea'); field.value = text; field.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.append(field); field.select();
    let copied = false; try { copied = document.execCommand('copy'); } finally { field.remove(); }
    if (!copied) { notify('복사하지 못했습니다. 내용을 길게 눌러 복사해 주세요.'); return; }
  }
  notify(`${label}를 복사했습니다.`);
}
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', () => copyText(button.dataset.copy, button.dataset.copyLabel)));
photos.forEach((number, index) => {
  const button = document.createElement('button'); button.className = 'gallery-item'; button.setAttribute('aria-label', `${index + 1}번째 웨딩 사진 크게 보기`);
  const img = document.createElement('img'); img.src = `assets/photo${number}.jpg`; img.alt = `성현과 지현의 웨딩 사진 ${index + 1}`; img.loading = 'lazy'; img.decoding = 'async';
  const caption = document.createElement('span'); caption.textContent = String(index + 1).padStart(2, '0') + ' ↗'; caption.setAttribute('aria-hidden', 'true'); button.append(img, caption);
  button.addEventListener('click', () => { photoIndex = index; renderPhoto(); $('#lightbox').showModal(); document.body.style.overflow = 'hidden'; }); $('#gallery-grid').append(button);
});
function renderPhoto() { $('#large-photo').src = `assets/photo${photos[photoIndex]}.jpg`; $('#large-photo').alt = `성현과 지현의 웨딩 사진 ${photoIndex + 1}`; $('#photo-count').textContent = `${String(photoIndex + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`; }
function movePhoto(direction) { photoIndex = (photoIndex + direction + photos.length) % photos.length; renderPhoto(); }
$('#close-photo').addEventListener('click', () => $('#lightbox').close());
$('#lightbox').addEventListener('close', () => { document.body.style.overflow = ''; });
$('#previous-photo').addEventListener('click', () => movePhoto(-1)); $('#next-photo').addEventListener('click', () => movePhoto(1));
$('#lightbox').addEventListener('keydown', event => { if (event.key === 'ArrowLeft') movePhoto(-1); if (event.key === 'ArrowRight') movePhoto(1); });
let touchX = 0;
$('.lightbox-image').addEventListener('touchstart', event => { touchX = event.changedTouches[0].clientX; }, { passive: true });
$('.lightbox-image').addEventListener('touchend', event => { const delta = event.changedTouches[0].clientX - touchX; if (Math.abs(delta) > 50) movePhoto(delta < 0 ? 1 : -1); }, { passive: true });
for (let blank = 0; blank < 5; blank++) $('#calendar-days').append(document.createElement('span'));
for (let day = 1; day <= 31; day++) { const cell = document.createElement('span'); cell.textContent = day; if (day === 17) { cell.className = 'wedding-day'; cell.setAttribute('aria-label', '1월 17일, 결혼식'); } $('#calendar-days').append(cell); }
const wedding = new Date('2027-01-17T15:10:00+09:00');
function updateCountdown() {
  const remaining = Math.max(0, wedding.getTime() - Date.now());
  const seconds = Math.floor(remaining / 1000); const days = Math.floor(seconds / 86400);
  const values = [days, Math.floor(seconds % 86400 / 3600), Math.floor(seconds % 3600 / 60), seconds % 60];
  ['days', 'hours', 'minutes', 'seconds'].forEach((name, i) => { $('#count-' + name).textContent = String(values[i]).padStart(2, '0'); });
  $('#countdown-note').textContent = remaining > 0 ? `우리의 첫 장이 시작되기까지 ${days}일` : '함께해 주신 따뜻한 마음, 감사합니다.';
}
updateCountdown(); setInterval(updateCountdown, 1000);
function foldLine(line) { const result = []; let part = ''; let bytes = 0; for (const char of line) { const size = new TextEncoder().encode(char).length; if (bytes + size > 75) { result.push(part); part = ' '; bytes = 1; } part += char; bytes += size; } result.push(part); return result.join('\r\n'); }
$('#calendar-add').addEventListener('click', () => {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SH JH Wedding//KO', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', 'UID:sh-jh-20270117@wedding-editorial', `DTSTAMP:${stamp}`, 'DTSTART:20270117T061000Z', 'SUMMARY:황성현 · 육지현 결혼식', 'LOCATION:서울특별시 구로구 경인로 624 라마다 서울 신도림 호텔 5층 세인트그레이스홀', 'DESCRIPTION:성현과 지현의 결혼식에 초대합니다.', 'END:VEVENT', 'END:VCALENDAR'];
  const url = URL.createObjectURL(new Blob([lines.map(foldLine).join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = '성현과-지현-결혼식.ics'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); notify('일정 파일을 열어 캘린더에 추가해 주세요.');
});
const audio = $('#audio'); audio.volume = .35;
function musicState() { $('#music').setAttribute('aria-pressed', String(!audio.paused)); $('#music').setAttribute('aria-label', audio.paused ? '배경음악 켜기' : '배경음악 끄기'); }
$('#music').addEventListener('click', async () => { if (!audio.paused) audio.pause(); else { try { await audio.play(); } catch { notify('음악을 재생할 수 없습니다. 다시 눌러 주세요.'); } } musicState(); });
audio.addEventListener('play', musicState); audio.addEventListener('pause', musicState);
$('#share').addEventListener('click', async () => {
  const url = location.href.split('#')[0];
  if (navigator.share) { try { await navigator.share({ title: '성현과 지현 — 우리의 첫 장', text: '2027년 1월 17일 오후 3시 10분, 저희 결혼식에 초대합니다.', url }); return; } catch (err) { if (err.name === 'AbortError') return; } }
  await copyText(url, '청첩장 링크');
});
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const reveal = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove('pending'); reveal.unobserve(entry.target); } }); }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(element => { element.classList.add('pending'); reveal.observe(element); });
}
if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) document.querySelectorAll('.bottom-nav a').forEach(link => link.classList.toggle('active', link.hash === '#' + entry.target.id)); }), { rootMargin: '-10% 0px -55% 0px' });
  ['gallery', 'date', 'location', 'gift'].forEach(id => navObserver.observe(document.getElementById(id)));
}
