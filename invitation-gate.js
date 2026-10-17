'use strict';

const invitationGate=document.querySelector('#invitation-gate');
const openInvitation=document.querySelector('#open-invitation');
const gateMainPreview=document.querySelector('#gate-main-preview');
const gateRoot=document.documentElement;
const gateReducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let gateOpened=false;
const gateBackground=[...document.body.children].filter(element=>element!==invitationGate&&element instanceof HTMLElement&&element.tagName!=='SCRIPT');

function setGateBackgroundInert(inert){
 gateBackground.forEach(element=>{element.inert=inert;});
}

function appendPreviewClone(element){
 if(!element||!gateMainPreview)return;
 const clone=element.cloneNode(true);
 clone.removeAttribute('id');
 clone.removeAttribute('tabindex');
 clone.setAttribute('aria-hidden','true');
 clone.inert=true;
 clone.querySelectorAll('[id]').forEach(child=>child.removeAttribute('id'));
 gateMainPreview.append(clone);
}

function buildMainPreview(){
 appendPreviewClone(document.querySelector('#home'));
 appendPreviewClone(document.querySelector('.palette'));
 appendPreviewClone(document.querySelector('.music'));
}

function finishInvitationGate(){
 if(!invitationGate)return;
 invitationGate.hidden=true;
 invitationGate.setAttribute('aria-hidden','true');
 gateRoot.classList.remove('has-invitation-gate');
 gateRoot.style.removeProperty('overflow');
 document.body.style.removeProperty('overflow');
 setGateBackgroundInert(false);
 gateMainPreview?.replaceChildren();
 document.querySelector('#home')?.focus({preventScroll:true});
}

function openInvitationGate(){
 if(gateOpened||!invitationGate)return;
 gateOpened=true;
 clearTimeout(window.__gateFallback);
 openInvitation.disabled=true;
 invitationGate.classList.add('is-opening');
 invitationGate.setAttribute('aria-busy','true');
 if(gateReducedMotion){
  invitationGate.classList.add('is-leaving');
  setTimeout(finishInvitationGate,280);
  return;
 }
 setTimeout(()=>invitationGate.classList.add('is-carousel-overview'),1450);
 setTimeout(()=>invitationGate.classList.add('is-carousel-enter'),2350);
 setTimeout(finishInvitationGate,3300);
}

if(invitationGate&&openInvitation){
 clearTimeout(window.__gateFallback);
 buildMainPreview();
 scrollTo(0,0);
 gateRoot.style.overflow='hidden';
 document.body.style.overflow='hidden';
 setGateBackgroundInert(true);
 openInvitation.addEventListener('click',openInvitationGate,{once:true});
 addEventListener('load',()=>openInvitation.focus({preventScroll:true}),{once:true});
}else{
 finishInvitationGate();
}
