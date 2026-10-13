'use strict';
const designs=window.weddingDesigns,select=document.querySelector('#design-select');
designs.forEach((d,i)=>{const option=document.createElement('option');option.value=d.id;option.textContent=`${String(i+1).padStart(2,'0')} · ${d.name}`;select.append(option);});
let active=0;
function show(id,push=false){
 active=Math.max(0,designs.findIndex(d=>d.id===id));const d=designs[active];
 select.value=d.id;document.querySelector('#viewer-count').textContent=`${String(active+1).padStart(2,'0')} / ${designs.length}`;
 document.querySelector('#viewer-name').textContent=d.name;document.title=d.name+' · 청첩장 체험';
 document.querySelector('#direct-link').href=d.url;
 const frame=document.querySelector('#design-frame');frame.title=d.ko+' 청첩장';frame.src=d.url;
 if(push)history.pushState(null,'','?design='+encodeURIComponent(d.id));
}
select.addEventListener('change',()=>show(select.value,true));
document.querySelector('#previous').addEventListener('click',()=>show(designs[(active-1+designs.length)%designs.length].id,true));
document.querySelector('#next').addEventListener('click',()=>show(designs[(active+1)%designs.length].id,true));
addEventListener('popstate',()=>show(new URLSearchParams(location.search).get('design')));
show(new URLSearchParams(location.search).get('design'));
