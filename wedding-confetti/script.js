'use strict';
const $=s=>document.querySelector(s),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastTimer;
function notify(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4000);}
const palettes={blue:['#cbdce5','#bb3f53'],pink:['#eed4d6','#863d50'],sage:['#d8dfce','#5d7353'],butter:['#f0e5b9','#3a5396']};
$('#palette').addEventListener('change',e=>{const [base,accent]=palettes[e.target.value];document.documentElement.style.setProperty('--powder',base);document.documentElement.style.setProperty('--cherry',accent);});
const opening=$('#home');
const openingShade=$('.opening-shade');
const interlude=$('#interlude');
const pendingReveals=new Set();
let scrollFrame=0;
function updateScrollEffects(){
 scrollFrame=0;
 if(reduced)return;
 const progress=Math.min(Math.max(window.scrollY/Math.max(window.innerHeight,1),0),1);
 const eased=1-(1-progress)**2;
 openingShade.style.opacity=String((progress*.32).toFixed(3));
 opening.style.setProperty('--panel-scale',(1-.07*eased).toFixed(4));
 opening.style.setProperty('--cover-shift',`${(-70*eased).toFixed(1)}px`);
 opening.style.setProperty('--cover-scale',(1+.16*eased).toFixed(4));
 const threshold=Math.min(opening.offsetHeight*.22,window.innerHeight*.18);
 opening.classList.toggle('is-scattered',window.scrollY>threshold);
 if(interlude){
  const progress=Math.min(Math.max((window.innerHeight-interlude.getBoundingClientRect().top)/(window.innerHeight+interlude.offsetHeight),0),1);
  const offset=120*(1-2*progress);
  interlude.querySelector('.interlude-title').style.setProperty('--row-offset',`${offset.toFixed(1)}px`);
  interlude.querySelector('.interlude-subtitle').style.setProperty('--row-offset',`${(-offset).toFixed(1)}px`);
 }
 pendingReveals.forEach(element=>{
  if(element.getBoundingClientRect().top>=window.innerHeight*.92)return;
  element.classList.add('is-revealed');
  pendingReveals.delete(element);
 });
}
function scheduleScrollEffects(){if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScrollEffects);}
window.addEventListener('scroll',scheduleScrollEffects,{passive:true});
window.addEventListener('resize',scheduleScrollEffects);
function setupScrollReveals(){
 if(reduced||!('IntersectionObserver'in window))return;
 const targets=new Map();
 const add=(element,type,delay=0)=>{
  if(element.closest('[hidden]'))return;
  if(!targets.has(element))targets.set(element,{type,delay});
 };
 document.querySelectorAll('.section,.day').forEach(section=>{
  [...section.children].forEach((element,index)=>{
   add(element,element.classList.contains('section-heading')?'wipe':'up',Math.min(index*65,260));
  });
 });
 document.querySelectorAll('.save-intro > *, .date-caption > *, .interlude-caption').forEach((element,index)=>{
  add(element,'up',Math.min(index*65,260));
 });
 document.querySelectorAll('.save-photo,.photo-banner > img').forEach(element=>add(element,'center'));
 targets.forEach(({type,delay},element)=>{
  element.classList.add('scroll-reveal',`scroll-reveal-${type}`);
  element.style.setProperty('--reveal-delay',`${delay}ms`);
  pendingReveals.add(element);
 });
}
setupScrollReveals();
scheduleScrollEffects();
const photos=[1,3,4,5,6,7,8,9,10];let activePhoto=0,photoTransition=0,ignoreGalleryClickUntil=0;
function transitionPhoto(image,source,alt,animate){
 image.alt=alt;
 const transition=String(++photoTransition);
 image.dataset.photoTransition=transition;
 if(!animate||reduced){image.src=source;image.classList.remove('is-changing');return;}
 image.classList.add('is-changing');
 requestAnimationFrame(()=>{
  if(image.dataset.photoTransition!==transition)return;
  image.src=source;
  requestAnimationFrame(()=>{if(image.dataset.photoTransition===transition)image.classList.remove('is-changing');});
 });
}
function renderPhoto(animate=false){const source=`assets/photo${photos[activePhoto]}.jpg`,alt=`성현과 지현의 웨딩 사진 ${activePhoto+1}`;transitionPhoto($('#gallery-photo'),source,alt,animate);transitionPhoto($('#large-photo'),source,alt,animate);$('#gallery-count').textContent=String(activePhoto+1).padStart(2,'0')+' / 09';$('#photo-count').textContent=`${activePhoto+1} / 9`;}
function movePhoto(delta){activePhoto=(activePhoto+delta+photos.length)%photos.length;renderPhoto(true);}
$('#gallery-prev').addEventListener('click',()=>movePhoto(-1));$('#gallery-next').addEventListener('click',()=>movePhoto(1));$('#previous-photo').addEventListener('click',()=>movePhoto(-1));$('#next-photo').addEventListener('click',()=>movePhoto(1));
$('#gallery-open').addEventListener('click',event=>{if(performance.now()<ignoreGalleryClickUntil){event.preventDefault();return;}renderPhoto();$('#lightbox').showModal();document.body.style.overflow='hidden';});$('#close-photo').addEventListener('click',()=>$('#lightbox').close());$('#lightbox').addEventListener('close',()=>{document.body.style.overflow='';$('#gallery-open').focus({preventScroll:true});});$('#lightbox').addEventListener('keydown',e=>{if(e.key==='ArrowRight')movePhoto(1);if(e.key==='ArrowLeft')movePhoto(-1);});
function enablePhotoSwipe(element,suppressClick=false){
 let start=null;
 element.addEventListener('touchstart',event=>{start={x:event.changedTouches[0].clientX,y:event.changedTouches[0].clientY};},{passive:true});
 element.addEventListener('touchend',event=>{
  if(!start)return;
  const deltaX=event.changedTouches[0].clientX-start.x,deltaY=event.changedTouches[0].clientY-start.y;
  start=null;
  if(Math.abs(deltaX)<=45||Math.abs(deltaX)<=Math.abs(deltaY))return;
  if(suppressClick)ignoreGalleryClickUntil=performance.now()+500;
  movePhoto(deltaX<0?1:-1);
 },{passive:true});
}
enablePhotoSwipe($('#gallery-open'),true);
enablePhotoSwipe($('.lightbox-image'));
document.querySelectorAll('[data-side]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-side]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('#groom-account').hidden=button.dataset.side!=='groom';$('#bride-account').hidden=button.dataset.side!=='bride';}));
$('#copy-link').addEventListener('click',()=>copyText(location.href.split('#')[0],'청첩장 링크'));
