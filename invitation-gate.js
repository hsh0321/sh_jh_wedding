'use strict';

const invitationGate=document.querySelector('#invitation-gate');
const openInvitation=document.querySelector('#open-invitation');
const velvetCanvas=document.querySelector('#velvet-transition');
const velvetFallback=document.querySelector('#velvet-fallback');
const gateRoot=document.documentElement;
const gateReducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let gateOpened=false;
const gateBackground=[...document.body.children].filter(element=>
 element instanceof HTMLElement&&
 element!==invitationGate&&
 element!==velvetCanvas&&
 element!==velvetFallback&&
 element.tagName!=='SCRIPT'
);

function setGateBackgroundInert(inert){
 gateBackground.forEach(element=>{element.inert=inert;});
}

function showInvitationBehindCurtain(){
 if(!invitationGate)return;
 invitationGate.hidden=true;
 invitationGate.setAttribute('aria-hidden','true');
 gateRoot.classList.remove('has-invitation-gate');
}

function finishInvitationGate(){
 if(!invitationGate)return;
 showInvitationBehindCurtain();
 velvetCanvas?.classList.remove('is-active');
 velvetFallback?.classList.remove('is-active','is-covering','is-revealing');
 gateRoot.style.removeProperty('overflow');
 document.body.style.removeProperty('overflow');
 setGateBackgroundInert(false);
 document.querySelector('#home')?.focus({preventScroll:true});
}

function runFallbackTransition(){
 if(!velvetFallback){
  finishInvitationGate();
  return;
 }
 velvetFallback.classList.add('is-active');
 requestAnimationFrame(()=>requestAnimationFrame(()=>velvetFallback.classList.add('is-covering')));
 setTimeout(()=>{
  showInvitationBehindCurtain();
  velvetFallback.classList.remove('is-covering');
  velvetFallback.classList.add('is-revealing');
  setTimeout(finishInvitationGate,1220);
 },1220);
}

function runVelvetTransition(){
 const THREE=globalThis.THREE;
 if(!THREE||!velvetCanvas){
  runFallbackTransition();
  return;
 }

 let renderer;
 let frame=0;
 try{
  renderer=new THREE.WebGLRenderer({canvas:velvetCanvas,alpha:true,antialias:false,powerPreference:'high-performance'});
 }catch(error){
  runFallbackTransition();
  return;
 }

 const scene=new THREE.Scene();
 const camera=new THREE.Camera();
 const geometry=new THREE.PlaneGeometry(2,2);
 const uniforms={uProgress:{value:0},uReveal:{value:0},uTime:{value:0},uResolution:{value:new THREE.Vector2(1,1)}};
 const material=new THREE.ShaderMaterial({
  transparent:true,depthTest:false,depthWrite:false,uniforms,
  vertexShader:'void main(){gl_Position=vec4(position,1.0);}',
  fragmentShader:`
   precision highp float;
   uniform float uProgress;
   uniform float uReveal;
   uniform float uTime;
   uniform vec2 uResolution;
   float hash(float n){return fract(sin(n)*43758.5453123);}
   float noise(float x){float i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);return mix(hash(i),hash(i+1.0),f);}
   void main(){
    vec2 pos=gl_FragCoord.xy/uResolution;
    float x=pos.x;
    float y=1.0-pos.y;
    float moving=sin(uProgress*3.14159265);
    float direction=mix(1.0,-1.0,uReveal);
    float edge=mix(1.08,-0.08,uProgress)+pow(y,1.5)*0.30*moving*direction+(noise(y*8.0+uTime*0.25)-0.5)*0.026*moving;
    float inside=x-edge;
    float cloth=smoothstep(-0.004,0.006,inside);
    float width=max(1.0-edge,0.055);
    float across=clamp(inside/width,0.0,1.0);
    float uneven=(noise(y*12.0+uTime*0.12)-0.5)*0.35;
    float phase=(across+uneven/10.0)*62.831853;
    float fold=sin(phase)+0.35*sin(phase*2.0+1.0);
    float slope=cos(phase)+0.70*cos(phase*2.0+1.0);
    vec3 normal=normalize(vec3(-slope*1.1,0.22,1.0));
    vec3 light=normalize(vec3(-0.62,0.52,0.72));
    float diffuse=clamp(dot(normal,light),0.0,1.0);
    float sheen=pow(diffuse,4.0)*0.35;
    float depth=(0.69+0.22*diffuse+0.08*fold+sheen)*mix(1.04,0.76,pow(y,3.0));
    vec3 velvet=mix(vec3(0.17,0.012,0.055),vec3(0.61,0.075,0.20),clamp(depth,0.0,1.0));
    velvet+=vec3(0.16,0.035,0.055)*sheen;
    float edgeShadow=(1.0-smoothstep(-0.055,0.0,inside))*smoothstep(-0.09,-0.015,inside);
    float outsideAlpha=max(uProgress*0.55*(1.0-cloth),edgeShadow*0.65);
    vec3 color=mix(vec3(0.025,0.003,0.012),velvet,cloth);
    gl_FragColor=vec4(color,max(cloth,outsideAlpha));
   }
  `
 });
 scene.add(new THREE.Mesh(geometry,material));
 velvetCanvas.dataset.engine='three-webgl';
 velvetCanvas.classList.add('is-active');

 function resize(){
  const ratio=Math.min(devicePixelRatio||1,1.35);
  renderer.setPixelRatio(ratio);
  renderer.setSize(innerWidth,innerHeight,false);
  uniforms.uResolution.value.set(innerWidth*ratio,innerHeight*ratio);
 }
 resize();
 addEventListener('resize',resize,{passive:true});
 const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
 const started=performance.now();
 let phase='cover';
 let revealStarted=0;

 function dispose(){
  cancelAnimationFrame(frame);
  removeEventListener('resize',resize);
  geometry.dispose();
  material.dispose();
  renderer.dispose();
  renderer.forceContextLoss?.();
 }

 function animate(now){
  uniforms.uTime.value=(now-started)/1000;
  if(phase==='cover'){
   const progress=Math.min((now-started)/1200,1);
   uniforms.uProgress.value=ease(progress);
   if(progress>=1){
    showInvitationBehindCurtain();
    phase='reveal';
    revealStarted=now+70;
    uniforms.uReveal.value=1;
   }
  }else{
   const progress=Math.max(0,Math.min((now-revealStarted)/1200,1));
   uniforms.uProgress.value=1-ease(progress);
   if(progress>=1){dispose();finishInvitationGate();return;}
  }
  renderer.render(scene,camera);
  frame=requestAnimationFrame(animate);
 }
 frame=requestAnimationFrame(animate);
}

function openInvitationGate(){
 if(gateOpened||!invitationGate)return;
 gateOpened=true;
 clearTimeout(window.__gateFallback);
 openInvitation.disabled=true;
 invitationGate.classList.add('is-opening');
 invitationGate.setAttribute('aria-busy','true');
 if(gateReducedMotion){setTimeout(finishInvitationGate,280);return;}
 runVelvetTransition();
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
