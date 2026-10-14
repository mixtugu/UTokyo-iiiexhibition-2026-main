(() => {
 const root=document.querySelector('#announce'),dialog=document.querySelector('#announce-detail');
 if(!root||!dialog)return;
 document.body.append(dialog);
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 let closing=0;
 function closeDetail(){
  if(!dialog.open)return;
  if(reducedMotion.matches){dialog.close();return;}
  if(closing)return;
  dialog.classList.add('is-closing');
  closing=setTimeout(()=>{closing=0;dialog.close();},180);
 }
 dialog.addEventListener('close',()=>{clearTimeout(closing);closing=0;dialog.classList.remove('is-closing');});
 dialog.addEventListener('cancel',event=>{event.preventDefault();closeDetail();});
 const eventBody='2026/11/14（土）14:00〜15:30（日本時間）\n\n会場：東京大学 工学部2号館\n東京都文京区本郷7丁目3−1\n\n参加登録：Peatixから事前にチケットをお申し込みください。\n\n登壇者・イベント内容は後日公開します。';
 const notices={event:{title:'東京大学制作展 2026 トークイベント',body:eventBody}};
 root.querySelectorAll('[data-notice]').forEach(button=>button.addEventListener('click',()=>{const n=notices[button.dataset.notice];dialog.querySelector('#notice-heading').textContent=n.title;dialog.querySelector('#notice-body').textContent=n.body;dialog.showModal();}));
 dialog.querySelector('.notice-close').addEventListener('click',closeDetail);
 dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))closeDetail();});
 root.classList.add('announce-normal-flow');
 const label=document.createElement('div');label.className='announce-fixed-label';label.setAttribute('aria-hidden','true');document.body.append(label);
 let queued=false;
 function update(){queued=false;const r=root.getBoundingClientRect();label.style.visibility=r.top<innerHeight&&r.bottom>0?'visible':'hidden';label.style.clipPath=`inset(${Math.max(0,r.top-(innerHeight-95))}px 0 0 0)`;label.style.transform=`translateY(${-Math.max(0,innerHeight-r.bottom)}px)`;}
 function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);update();
})();
