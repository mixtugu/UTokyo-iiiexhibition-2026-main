(()=>{
 const root=document.querySelector('.announce');
 if(!root)return;
 const dialog=document.querySelector('#announce-detail');
 // Keep the modal outside the scrolling / sticky sections.
 document.body.append(dialog);
 const notices={
  event:{title:'制作展トークイベントを開催します。',body:'11/14（土）14:00〜15:30に、トークイベントを開催します。\n\n登壇者・参加方法などの詳細は、決まり次第こちらでお知らせします。'},
  information:{title:'登壇者が確定。詳細ページが更新されました。',body:'登壇者・参加方法などの詳細は、決まり次第こちらでお知らせします。'}
 };
 root.querySelectorAll('[data-notice]').forEach(button=>button.addEventListener('click',()=>{
  const notice=notices[button.dataset.notice];
  dialog.querySelector('#notice-heading').textContent=notice.title;
  dialog.querySelector('#notice-body').textContent=notice.body;
  dialog.showModal();
 }));
 dialog.querySelector('.notice-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{
  const r=dialog.getBoundingClientRect();
  if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();
 });
 const chapters=[...root.querySelectorAll('.announce-chapter')];
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const pin=document.createElement('div');pin.className='announce-pin';
 const panels=document.createElement('div');panels.className='announce-panels';
 root.prepend(pin);
 pin.append(root.querySelector('.section-top'),root.querySelector('#announce-heading'),panels);
 panels.append(...chapters);
 // Reveal the support image and its link separately, just like the event rows.
 const fundCard=root.querySelector('.fund-card');
 if(fundCard){
  fundCard.classList.remove('announce-reveal');
  [...fundCard.children].forEach(item=>item.classList.add('announce-reveal'));
 }
 chapters.forEach(chapter=>{
  chapter.querySelectorAll('.announce-reveal:not(.announce-intro)').forEach((item,index)=>{
   item.style.setProperty('--reveal-delay',`${160+index*90}ms`);
  });
 });
 let queued=false,enabled=false,runway=0;
 const clamp=x=>Math.max(0,Math.min(1,x));
 const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
 function update(){
  queued=false;
  const progress=enabled?clamp(-root.getBoundingClientRect().top/runway):0;
  const out=ease((progress-.1)/.32),enter=ease((progress-.3)/.38);
  chapters.forEach((chapter,i)=>{
   const opacity=enabled?(i===0?1-out:enter):1;
   chapter.style.setProperty('--panel-opacity',opacity);
   chapter.style.setProperty('--panel-y',(enabled?(i===0?-36*out:48*(1-enter)):0)+'px');
   const hidden=enabled&&(i===0?progress>=.42:progress<.3);
   if(hidden&&chapter.contains(document.activeElement))document.activeElement.blur();
   chapter.inert=hidden;
   if(hidden)chapter.setAttribute('aria-hidden','true');else chapter.removeAttribute('aria-hidden');
   const rect=chapter.getBoundingClientRect();
   const reveal=!hidden&&rect.top<innerHeight*.72&&rect.bottom>0;
   chapter.querySelectorAll('.announce-reveal').forEach(item=>{
    item.classList.toggle('is-visible',motion.matches||reveal);
   });
  });
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
 function measure(){
  root.classList.add('announce-staged');
  root.style.removeProperty('--announce-height');
  const height=pin.offsetHeight;
  // Fall back to normal flow when content is taller than the viewport.
  enabled=!motion.matches&&height<=innerHeight;
  runway=Math.round(Math.min(380,innerHeight*.52));
  root.classList.toggle('announce-staged',enabled);
  if(enabled)root.style.setProperty('--announce-height',(innerHeight+runway)+'px');
  root.classList.toggle('announce-motion',!motion.matches);
  update();
 }
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',measure);
 addEventListener('load',measure);
 motion.addEventListener('change',measure);
 document.fonts.ready.then(measure);
 measure();
})();
