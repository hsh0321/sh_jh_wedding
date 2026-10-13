document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 const group=button.dataset.filter; let count=0;
 document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 document.querySelectorAll('.card').forEach(card=>{card.hidden=group!=='all'&&card.dataset.group!==group;if(!card.hidden)count++;});
 document.querySelector('#result-count').textContent=count+' DESIGNS';
}));
