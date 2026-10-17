'use strict';

const invitationGate=document.querySelector('#invitation-gate');
const openInvitation=document.querySelector('#open-invitation');
const gateRoot=document.documentElement;
const gateReducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let gateOpened=false;
const gateBackground=[...document.body.children].filter(element=>element!==invitationGate&&element instanceof HTMLElement&&element.tagName!=='SCRIPT');

function setGateBackgroundInert(inert){
 gateBackground.forEach(element=>{element.inert=inert;});
}

function finishInvitationGate(){
 if(!invitationGate)return;
 invitationGate.hidden=true;
 invitationGate.setAttribute('aria-hidden','true');
 gateRoot.classList.remove('has-invitation-gate');
 gateRoot.style.removeProperty('overflow');
 document.body.style.removeProperty('overflow');
 setGateBackgroundInert(false);
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
 setTimeout(()=>invitationGate.classList.add('is-leaving'),1500);
 setTimeout(finishInvitationGate,2050);
}

if(invitationGate&&openInvitation){
 clearTimeout(window.__gateFallback);
 scrollTo(0,0);
 gateRoot.style.overflow='hidden';
 document.body.style.overflow='hidden';
 setGateBackgroundInert(true);
 openInvitation.addEventListener('click',openInvitationGate,{once:true});
 addEventListener('load',()=>openInvitation.focus({preventScroll:true}),{once:true});
}else{
 finishInvitationGate();
}
