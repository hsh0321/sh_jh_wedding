'use strict';
// Discourage native image saving without blocking gallery pointer gestures.
document.querySelectorAll('img').forEach(image=>{image.draggable=false;});
function blockPhotoAction(event){
 if(event.target instanceof Element&&event.target.closest('img,.heart-photo,.gallery-viewport'))event.preventDefault();
}
document.addEventListener('contextmenu',blockPhotoAction);
document.addEventListener('dragstart',blockPhotoAction);
// iOS Safari can ignore viewport zoom limits; cancel its native pinch gesture.
for(const type of ['gesturestart','gesturechange']){
 document.addEventListener(type,event=>event.preventDefault(),{passive:false});
}
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
let lastOpeningProgress=-1,lastInterludeOffset=null;
const interludeTitle=interlude?.querySelector('.interlude-title');
const interludeSubtitle=interlude?.querySelector('.interlude-subtitle');
function updateScrollEffects(){
 scrollFrame=0;
 if(reduced)return;
 // Read geometry before changing styles so scroll frames do not force layout.
 const viewportHeight=window.innerHeight;
 const scrollY=window.scrollY;
 const openingHeight=opening.offsetHeight;
 const progress=Math.min(Math.max(scrollY/Math.max(viewportHeight,1),0),1);
 const eased=1-(1-progress)**2;
 const threshold=Math.min(openingHeight*.22,viewportHeight*.18);
 let offset=null;
 if(interlude){
  const interludeProgress=Math.min(Math.max((viewportHeight-interlude.getBoundingClientRect().top)/(viewportHeight+interlude.offsetHeight),0),1);
  offset=120*(1-2*interludeProgress);
 }
 const ready=[];
 pendingReveals.forEach(element=>{
  if(element.getBoundingClientRect().top<viewportHeight*.92)ready.push(element);
 });
 // The cover's values stop changing once it is fully behind the content.
 if(progress!==lastOpeningProgress){
  openingShade.style.opacity=String((progress*.32).toFixed(3));
  opening.style.setProperty('--panel-scale',(1-.07*eased).toFixed(4));
  opening.style.setProperty('--cover-shift',`${(-70*eased).toFixed(1)}px`);
  opening.style.setProperty('--cover-scale',(1+.16*eased).toFixed(4));
  lastOpeningProgress=progress;
 }
 opening.classList.toggle('is-scattered',scrollY>threshold);
 if(offset!==null&&offset!==lastInterludeOffset){
  interludeTitle.style.setProperty('--row-offset',`${offset.toFixed(1)}px`);
  interludeSubtitle.style.setProperty('--row-offset',`${(-offset).toFixed(1)}px`);
  lastInterludeOffset=offset;
 }
 ready.forEach(element=>{
  element.classList.add('is-revealed');
  pendingReveals.delete(element);
 });
}
function scheduleScrollEffects(){if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScrollEffects);}
window.addEventListener('scroll',scheduleScrollEffects,{passive:true});
window.addEventListener('resize',scheduleScrollEffects);
function setupScrollReveals(){
 if(reduced)return;
 const targets=new Map();
 const add=(element,type,delay=0)=>{
  if(element.closest('[hidden]'))return;
  if(!targets.has(element))targets.set(element,{type,delay});
 };
 document.querySelectorAll('.section,.day').forEach(section=>{
  [...section.children].forEach((element,index)=>{
   if(element.id==='gallery-viewport')return;
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
const photos=[1,3,4,5,6,7,8,9,10];
const gallery=$('#gallery-viewport');
const currentPhoto=$('#gallery-photo');
const nextPhoto=$('#gallery-next-photo');
let activePhoto=0,drag=null,animating=false,animationTimer=0;
function photoSource(index){return `assets/photo${photos[(index+photos.length)%photos.length]}.jpg`;}
function updatePhotoCount(){$('#gallery-count').textContent=`${String(activePhoto+1).padStart(2,'0')} / 09`;}
function setNeighbor(direction,preservePosition=false){
 const index=(activePhoto+direction+photos.length)%photos.length;
 const source=photoSource(index);
 const changed=nextPhoto.dataset.index!==String(index);
 if(changed){
  nextPhoto.dataset.index=String(index);
  nextPhoto.src=source;
 }
 nextPhoto.alt=`성현과 지현의 웨딩 사진 ${index+1}`;
 if(!preservePosition||changed)nextPhoto.style.transform=`translateX(${direction*100}%)`;
 return index;
}
function setDragOffset(offset,direction){
 currentPhoto.style.transition='none';
 nextPhoto.style.transition='none';
 currentPhoto.style.transform=`translateX(${offset}px)`;
 nextPhoto.style.transform=`translateX(calc(${direction*100}% + ${offset}px))`;
}
function resetDrag(animate=true){
 currentPhoto.style.transition=animate?'transform .24s ease-out':'none';
 nextPhoto.style.transition=animate?'transform .24s ease-out':'none';
 if(animate)gallery.getBoundingClientRect();
 currentPhoto.style.transform='';
 nextPhoto.style.transform='translateX(100%)';
 window.setTimeout(()=>{currentPhoto.style.transition='';nextPhoto.style.transition='';},animate?260:0);
}
function finishTransition(direction,targetIndex){
 window.clearTimeout(animationTimer);
 activePhoto=targetIndex;
 currentPhoto.src=photoSource(activePhoto);
 currentPhoto.alt=`성현과 지현의 웨딩 사진 ${activePhoto+1}`;
 currentPhoto.classList.remove('is-sliding');
 nextPhoto.classList.remove('is-sliding');
 nextPhoto.dataset.index='';
 gallery.classList.remove('is-sliding');
 currentPhoto.style.transition='none';
 nextPhoto.style.transition='none';
 currentPhoto.style.transform='';
 nextPhoto.style.transform='translateX(100%)';
 animating=false;
 updatePhotoCount();
 requestAnimationFrame(()=>{currentPhoto.style.transition='';nextPhoto.style.transition='';});
 preloadAdjacent();
}
function preloadAdjacent(){
 [-1,1].forEach(direction=>{const image=new Image();image.src=photoSource(activePhoto+direction);});
}
function movePhoto(direction,preserveDrag=false){
 if(animating)return;
 const targetIndex=setNeighbor(direction,preserveDrag);
 animating=true;
 gallery.classList.add('is-sliding');
 gallery.getBoundingClientRect();
 currentPhoto.classList.add('is-sliding');
 nextPhoto.classList.add('is-sliding');
 currentPhoto.style.transition='';
 nextPhoto.style.transition='';
 currentPhoto.style.transform=`translateX(${direction>0?-100:100}%)`;
 nextPhoto.style.transform='translateX(0)';
 const done=()=>finishTransition(direction,targetIndex);
 nextPhoto.addEventListener('transitionend',event=>{if(event.propertyName==='transform')done();},{once:true});
 animationTimer=window.setTimeout(done,450);
}
$('#gallery-prev').addEventListener('click',()=>movePhoto(-1));
$('#gallery-next').addEventListener('click',()=>movePhoto(1));
gallery.addEventListener('pointerdown',event=>{
 if(animating||event.button>0)return;
 drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,direction:0,axis:null,samples:[{x:event.clientX,time:performance.now()}]};
 gallery.setPointerCapture(event.pointerId);
});
window.addEventListener('pointermove',event=>{
 if(!drag||event.pointerId!==drag.id)return;
 drag.x=event.clientX;drag.y=event.clientY;
 const now=performance.now();
 drag.samples.push({x:event.clientX,time:now});
 drag.samples=drag.samples.filter(sample=>now-sample.time<=100);
 const dx=drag.x-drag.startX,dy=drag.y-drag.startY;
 if(!drag.axis&&Math.max(Math.abs(dx),Math.abs(dy))>7)drag.axis=Math.abs(dx)>Math.abs(dy)*1.15?'x':'y';
 if(drag.axis!=='x')return;
 event.preventDefault();
 const direction=dx<0?1:-1;
 if(direction!==drag.direction){drag.direction=direction;setNeighbor(direction);}
 setDragOffset(dx,direction);
});
window.addEventListener('pointerup',event=>{
 if(!drag||event.pointerId!==drag.id)return;
 const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY,direction=dx<0?1:-1;
 const now=performance.now();
 const recent=drag.samples.filter(sample=>now-sample.time<=100);
 const first=recent[0],last=recent[recent.length-1];
 const velocity=first&&last&&last.time>first.time?(last.x-first.x)/(last.time-first.time):0;
 const shouldChange=drag.axis==='x'&&Math.abs(dx)>Math.abs(dy)*1.15&&(Math.abs(dx)>Math.max(48,gallery.clientWidth*.18)||Math.abs(velocity)>.55);
 drag=null;
 if(shouldChange){movePhoto(direction,true);return;}
 resetDrag();
});
gallery.addEventListener('pointercancel',()=>{drag=null;resetDrag();});
gallery.addEventListener('lostpointercapture',()=>{if(drag){drag=null;resetDrag();}});
gallery.addEventListener('keydown',event=>{
 if(event.key==='ArrowLeft'){event.preventDefault();movePhoto(-1);}
 if(event.key==='ArrowRight'){event.preventDefault();movePhoto(1);}
});
updatePhotoCount();
preloadAdjacent();
document.querySelectorAll('[data-side]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-side]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('#groom-account').hidden=button.dataset.side!=='groom';$('#bride-account').hidden=button.dataset.side!=='bride';}));
$('#copy-link').addEventListener('click',()=>copyText(location.href.split('#')[0],'청첩장 링크'));
