(() => {
 const root=document.querySelector('#announce');
 if(!root)return;
 root.classList.add('announce-normal-flow');
 const label=document.createElement('div');label.className='announce-fixed-label';label.setAttribute('aria-hidden','true');document.body.append(label);
 let queued=false;
 function update(){queued=false;const r=root.getBoundingClientRect();label.style.visibility=r.top<innerHeight&&r.bottom>0?'visible':'hidden';const height=label.offsetHeight;label.style.clipPath=`inset(${Math.max(0,r.top-(innerHeight-height))}px 0 ${Math.max(0,innerHeight-r.bottom)}px 0)`;label.style.transform='none';}
 function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);update();
})();
