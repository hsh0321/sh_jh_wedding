const canvas=document.querySelector('#ink-intro');
const root=document.documentElement;

function finishIntro(){
 if(!canvas||canvas.classList.contains('is-finished'))return;
 canvas.classList.add('is-finished');
 root.classList.remove('is-ink-entering');
}

async function startInkIntro(){
 if(!canvas)return;
 root.classList.add('is-ink-entering');
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){
  setTimeout(finishIntro,120);
  return;
 }

 const THREE=globalThis.THREE;
 if(!THREE){
  console.warn('Three.js is unavailable for the ink entrance.');
  finishIntro();
  return;
 }

 let renderer,animationFrame=0,finished=false;
 try{
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'high-performance'});
  canvas.dataset.engine='three-webgl';
 }catch(error){
  console.warn('WebGL is unavailable for the ink entrance.',error);
  finishIntro();
  return;
 }

 const scene=new THREE.Scene();
 const camera=new THREE.Camera();
 const geometry=new THREE.PlaneGeometry(2,2);
 const colorValue=getComputedStyle(root).getPropertyValue('--cherry').trim()||'#bb3f53';
 const uniforms={
  uProgress:{value:0},
  uResolution:{value:new THREE.Vector2(1,1)},
  uColor:{value:new THREE.Color(colorValue)},
  uSeed:{value:Math.random()*20}
 };
 const material=new THREE.ShaderMaterial({
  transparent:true,
  depthTest:false,
  depthWrite:false,
  uniforms,
  vertexShader:`
   void main(){
    gl_Position=vec4(position,1.0);
   }
  `,
  fragmentShader:`
   precision highp float;
   uniform float uProgress;
   uniform vec2 uResolution;
   uniform vec3 uColor;
   uniform float uSeed;

   float hash(vec2 point){
    point=fract(point*vec2(123.34,456.21));
    point+=dot(point,point+45.32+uSeed);
    return fract(point.x*point.y);
   }

   float noise(vec2 point){
    vec2 cell=floor(point);
    vec2 local=fract(point);
    local=local*local*(3.0-2.0*local);
    return mix(
     mix(hash(cell),hash(cell+vec2(1.0,0.0)),local.x),
     mix(hash(cell+vec2(0.0,1.0)),hash(cell+vec2(1.0)),local.x),
     local.y
    );
   }

   float fbm(vec2 point){
    float value=0.0;
    float weight=0.5;
    mat2 turn=mat2(0.80,0.60,-0.60,0.80);
    for(int octave=0;octave<5;octave++){
     value+=weight*noise(point);
     point=turn*point*2.03+vec2(7.1,3.7);
     weight*=0.5;
    }
    return value;
   }

   void main(){
    vec2 position=gl_FragCoord.xy/uResolution;
    vec2 origin=vec2(0.5,0.52);
    vec2 delta=position-origin;
    delta.x*=uResolution.x/uResolution.y;
    float reach=max(
     length(vec2(max(origin.x,1.0-origin.x)*uResolution.x/uResolution.y,origin.y)),
     length(vec2(max(origin.x,1.0-origin.x)*uResolution.x/uResolution.y,1.0-origin.y))
    );
    float distanceFromOrigin=length(delta)/reach;
    float broad=fbm(position*3.15+vec2(uSeed*.07,0.0));
    float detail=fbm(position*8.0-vec2(0.0,uSeed*.05));
    float field=distanceFromOrigin+(broad-.5)*.29+(detail-.5)*.075;
    float threshold=mix(-.12,1.25,uProgress);
    float softness=.022;
    float alpha=smoothstep(threshold-softness,threshold+softness,field);
    gl_FragColor=vec4(uColor,alpha);
   }
  `
 });
 const mesh=new THREE.Mesh(geometry,material);
 scene.add(mesh);

 function resize(){
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.35));
  renderer.setSize(Math.max(innerWidth,1),Math.max(innerHeight,1),false);
  renderer.getDrawingBufferSize(uniforms.uResolution.value);
 }

 function dispose(){
  if(finished)return;
  finished=true;
  cancelAnimationFrame(animationFrame);
  removeEventListener('resize',resize);
  geometry.dispose();
  material.dispose();
  renderer.dispose();
  renderer.forceContextLoss();
  finishIntro();
 }

 resize();
 addEventListener('resize',resize,{passive:true});
 renderer.setClearColor(0x000000,0);
 renderer.render(scene,camera);
 canvas.style.background='transparent';
 const duration=1100;
 const started=performance.now()+110;

 function render(now){
  const raw=Math.min(Math.max((now-started)/duration,0),1);
  uniforms.uProgress.value=1-(1-raw)*(1-raw);
  renderer.render(scene,camera);
  if(raw<1){animationFrame=requestAnimationFrame(render);return;}
  dispose();
 }

 animationFrame=requestAnimationFrame(render);
 addEventListener('pagehide',dispose,{once:true});
 setTimeout(dispose,2600);
}

startInkIntro();
