'use strict';

const invitationGate=document.querySelector('#invitation-gate');
const openInvitation=document.querySelector('#open-invitation');
const frameTransition=document.querySelector('#frame-transition');
const frameColor=document.querySelector('.frame-color');
const frameNextView=document.querySelector('#frame-next-view');
const gateRoot=document.documentElement;
const gateReducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let gateOpened=false;
const gateBackground=[...document.body.children].filter(element=>
 element instanceof HTMLElement&&
 element!==invitationGate&&
 element!==frameTransition&&
 element.tagName!=='SCRIPT'
);

function setGateBackgroundInert(inert){
 gateBackground.forEach(element=>{element.inert=inert;});
}

function appendPreviewClone(element){
 if(!element||!frameNextView)return;
 const clone=element.cloneNode(true);
 clone.removeAttribute('id');
 clone.removeAttribute('tabindex');
 clone.setAttribute('aria-hidden','true');
 clone.inert=true;
 clone.querySelectorAll('[id]').forEach(child=>child.removeAttribute('id'));
 frameNextView.append(clone);
}

function buildNextPagePreview(){
 appendPreviewClone(document.querySelector('#home'));
 appendPreviewClone(document.querySelector('.palette'));
 appendPreviewClone(document.querySelector('.music'));
}

function revealRealInvitation(){
 if(!invitationGate)return;
 invitationGate.hidden=true;
 invitationGate.setAttribute('aria-hidden','true');
 gateRoot.classList.remove('has-invitation-gate');
}

function finishInvitationGate(){
 if(!invitationGate)return;
 revealRealInvitation();
 frameTransition?.classList.remove('is-active');
 frameNextView?.replaceChildren();
 gateRoot.style.removeProperty('overflow');
 document.body.style.removeProperty('overflow');
 setGateBackgroundInert(false);
 document.querySelector('#home')?.focus({preventScroll:true});
}

async function runFrameTransition(){
 if(!frameTransition||!frameColor||!frameNextView||typeof frameColor.animate!=='function'){
  setTimeout(finishInvitationGate,320);
  return;
 }
 const small='inset(50% 35% 50% 35%)';
 const full='inset(0% 0% 0% 0%)';
 const timing={duration:1200,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'};
 frameTransition.classList.add('is-active');
 const colorAnimation=frameColor.animate([{clipPath:small},{clipPath:full}],timing);
 const viewAnimation=frameNextView.animate([{clipPath:small},{clipPath:full}],{...timing,delay:150});
 try{
  await Promise.all([colorAnimation.finished,viewAnimation.finished]);
 }catch(error){
  // A cancelled animation still ends on the fully revealed invitation below.
 }
 frameColor.style.clipPath=full;
 frameNextView.style.clipPath=full;
 revealRealInvitation();
 requestAnimationFrame(()=>requestAnimationFrame(finishInvitationGate));
}

function openInvitationGate(){
 if(gateOpened||!invitationGate)return;
 gateOpened=true;
 clearTimeout(window.__gateFallback);
 openInvitation.disabled=true;
 invitationGate.classList.add('is-opening');
 invitationGate.setAttribute('aria-busy','true');
 if(gateReducedMotion){
  invitationGate.animate([{opacity:1},{opacity:0}],{duration:260,easing:'ease-out',fill:'forwards'});
  setTimeout(finishInvitationGate,270);
  return;
 }
 runFrameTransition();
}

if(invitationGate&&openInvitation){
 clearTimeout(window.__gateFallback);
 buildNextPagePreview();
 scrollTo(0,0);
 gateRoot.style.overflow='hidden';
 document.body.style.overflow='hidden';
 setGateBackgroundInert(true);
 openInvitation.addEventListener('click',openInvitationGate,{once:true});
 addEventListener('load',()=>openInvitation.focus({preventScroll:true}),{once:true});
}else{
 finishInvitationGate();
}
