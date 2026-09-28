(() => {
 const root=document.querySelector('#announce'),dialog=document.querySelector('#announce-detail');
 if(!root||!dialog)return;
 document.body.append(dialog);
 const notices={event:{title:'制作展トークイベントを開催します。',body:'11/14（土）14:00〜15:30に、トークイベントを開催します。\n\n登壇者・参加方法などの詳細は、決まり次第こちらでお知らせします。'},information:{title:'登壇者が確定。詳細ページが更新されました。',body:'登壇者・参加方法などの詳細は、決まり次第こちらでお知らせします。'}};
 root.querySelectorAll('[data-notice]').forEach(button=>button.addEventListener('click',()=>{const n=notices[button.dataset.notice];dialog.querySelector('#notice-heading').textContent=n.title;dialog.querySelector('#notice-body').textContent=n.body;dialog.showModal();}));
 dialog.querySelector('.notice-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
 root.classList.add('announce-normal-flow');
 const label=document.createElement('div');label.className='announce-fixed-label';label.setAttribute('aria-hidden','true');document.body.append(label);
 let queued=false;
 function update(){queued=false;const r=root.getBoundingClientRect();label.style.visibility=r.top<innerHeight&&r.bottom>0?'visible':'hidden';label.style.clipPath=`inset(${Math.max(0,r.top-(innerHeight-95))}px 0 0 0)`;label.style.transform=`translateY(${-Math.max(0,innerHeight-r.bottom)}px)`;}
 function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);update();
})();
