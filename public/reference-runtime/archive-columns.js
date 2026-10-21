(() => {
 const records = [
  ['本展','2025','あることないこと','https://2025-main.pages.dev/','main-2025-visual.jpg'],
  ['本展','2024','付いて離れて','https://2024-main.pages.dev/','main-2024-visual.jpg'],
  ['本展','2023','學藝運動','https://iii-exhibition2023-main.vercel.app/','../main-2023.png'],
  ['本展','2022','Emulsion','https://archive.iiiexhibition.com/log/i3e24','main-2022-visual.jpg'],
  ['本展','2021','キョリブレーション','https://archive.iiiexhibition.com/log/i3e23','main-2021.png'],
  ['本展','2020','弛む','https://archive.iiiexhibition.com/log/i3e22','main-2020-visual.png'],
  ['本展','2019','ああ言えばこう言う。こう言えばどう言う？','https://archive.iiiexhibition.com/log/i3e21','main-2019-visual.png'],
  ['本展','2018','Destlogy REBUILD','https://archive.iiiexhibition.com/log/i3e20','main-2018-visual.jpg'],
  ['本展','2017','WYSIWYG?','https://archive.iiiexhibition.com/log/i3e19','main-2017-visual.jpg'],
  ['本展','2016','FAKE FUTURE','https://archive.iiiexhibition.com/log/i3e18','main-2016-visual.jpg'],
  ['本展','2015','わたしエクステンション','https://archive.iiiexhibition.com/log/i3e17','main-2015-visual.png'],
  ['本展','2014','!!!','https://archive.iiiexhibition.com/log/i3e16','main-2014-visual.png'],
  ['本展','2013','mosaic','https://archive.iiiexhibition.com/log/i3e15','main-2013-visual.png'],
  ['本展','2012','いとをかし','https://archive.iiiexhibition.com/log/i3e14','main-2012-visual.png'],
  ['本展','2011','Re:','https://archive.iiiexhibition.com/log/i3e13','main-2011-visual.jpg'],
  ['番外展','2026','たゆたう','https://utokyo-iiiexhibition-2026-beginning.pages.dev/','extra-2026-visual.jpg'],
  ['番外展','2025','あることないこと','https://iii-exhibition2025-beginning.pages.dev','extra-2025-visual.png'],
  ['番外展','2024','なにいう展','https://iii-exhibition-2024-web.vercel.app/','../extra-2024.png'],
  ['番外展','2023','voidage','https://iii-exhibition2023.vercel.app/','extra-2023-voidage.png'],
  ['番外展','2022','Emulsion','https://archive.iiiexhibition.com/log/iiiEx2022','extra-2022-visual.png'],
  ['番外展','2021','0PUNK','https://archive.iiiexhibition.com/log/iiiEx2021','extra-2021-visual.jpg'],
  ['番外展','2020','WHO ZIPS YOU?','https://archive.iiiexhibition.com/log/iiiEx2020','extra-2020-visual.png'],
  ['番外展','2019',"enact one's self",'https://archive.iiiexhibition.com/log/iiiEx2019','extra-2019-visual.jpg'],
  ['番外展','2018','Dest-logy','https://archive.iiiexhibition.com/log/iiiEx2018','extra-2018-visual.png'],
  ['番外展','2017','SUKIMANIAC','https://archive.iiiexhibition.com/log/iiiEx2017','extra-2017-visual.png'],
  ['番外展','2016','補序線','https://archive.iiiexhibition.com/log/iiiEx2016','extra-2016-visual.jpg'],
  ['番外展','2015','グッバイ・マイ・ボディ','https://archive.iiiexhibition.com/log/iiiEx2015','extra-2015-visual.jpg'],
  ['番外展','2014','リアルからちょっと離れてる空間','https://archive.iiiexhibition.com/log/iiiEx2014','extra-2014-visual.png'],
  ['番外展','2013','⏻','https://archive.iiiexhibition.com/log/iiiEx2013','extra-2013-visual.png'],
  ['番外展','2012','パルス','https://archive.iiiexhibition.com/log/iiiEx2012','extra-2012-visual.png']
 ];
 const root=document.querySelector('#archives .archive-links');
 if(!root)return;
 root.classList.replace('archive-links','archive-columns');
 // Both categories stay visible together: stacked on desktop, side by side on phones.
 const groups=document.createElement('div');groups.className='archive-groups';root.append(groups);
 const touchDevice=matchMedia('(hover: none) and (pointer: coarse), (max-width: 767px)');
 let active=null;
 function expand(column){
  active=column;
  root.querySelectorAll('.archive-rail').forEach(rail=>rail.classList.toggle('has-active',!!column&&rail.contains(column)));
  root.querySelectorAll('.archive-column-link').forEach(link=>link.classList.toggle('is-active',link===column));
 }
 for(const [group,label] of [['本展','iii exhibition'],['番外展','beginning']]){
  const section=document.createElement('div');section.className='archive-group';section.dataset.group=group;
  const heading=document.createElement('p');heading.className='archive-group-label';heading.textContent=label;
  const viewport=document.createElement('div');viewport.className='archive-viewport';
  const rail=document.createElement('div');rail.className='archive-rail';rail.setAttribute('aria-label',`過去の制作展（${label}）`);viewport.append(rail);
  section.append(heading,viewport);groups.append(section);
  const entries=records.filter(record=>record[0]===group);
  rail.style.setProperty('--column-count',entries.length);
  entries.forEach(([,year,title,url,image])=>{
   const link=document.createElement('a');link.className='archive-column-link';link.href=url;link.target='_blank';link.rel='noopener noreferrer';
   link.setAttribute('aria-label',`${year}年 ${title} のサイトを開く`);
   const photo=document.createElement('img');photo.src='assets/archive/imported/'+image;photo.alt='';photo.loading='lazy';photo.draggable=false;
   const caption=document.createElement('span');caption.className='archive-column-label';
   const number=document.createElement('span');number.className='archive-column-year';number.textContent=year;
   const detail=document.createElement('span');detail.className='archive-column-detail';
   const name=document.createElement('strong');name.textContent=title;
   const arrow=document.createElement('span');arrow.textContent='サイトを見る ↗';detail.append(name,arrow);caption.append(number,detail);link.append(photo,caption);
   link.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'||event.pointerType==='pen')expand(link);});
   link.addEventListener('focus',()=>{if(matchMedia('(hover: hover)').matches)expand(link);});
   link.addEventListener('click',event=>{
    if(suppressClick){event.preventDefault();suppressClick=false;return;}
    if(matchMedia('(hover: none)').matches&&active!==link){event.preventDefault();expand(link);}
   });
   rail.append(link);
  });
  rail.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'||event.pointerType==='pen')expand(null);});
 }
 root.addEventListener('focusout',event=>{if(!root.contains(event.relatedTarget)&&matchMedia('(hover: hover)').matches)expand(null);});

 // Phones: press and hold, then slide the finger to scrub a large preview of the year under it.
 const preview=document.createElement('div');preview.className='archive-preview';preview.setAttribute('aria-hidden','true');
 preview.innerHTML='<img alt=""><span class="archive-preview-caption"><span class="archive-preview-year"></span><strong></strong></span>';
 document.body.append(preview);
 const previewImage=preview.querySelector('img'),previewYear=preview.querySelector('.archive-preview-year'),previewTitle=preview.querySelector('strong');
 let holdTimer=0,scrubbing=false,suppressClick=false,startX=0,startY=0,current=null;
 function linkAt(x,y){return document.elementFromPoint(x,y)?.closest?.('#archives .archive-column-link')||null;}
 function place(x,y){
  const box=preview.getBoundingClientRect(),gap=28;
  let top=y-box.height-gap;if(top<12)top=Math.min(innerHeight-box.height-12,y+gap);
  const left=Math.max(12,Math.min(innerWidth-box.width-12,x-box.width/2));
  preview.style.transform=`translate(${left}px,${top}px)`;
 }
 function showPreview(link,x,y){
  if(link&&link!==current){
   current=link;
   previewImage.src=link.querySelector('img').src;
   previewYear.textContent=link.querySelector('.archive-column-year').textContent;
   previewTitle.textContent=link.querySelector('.archive-column-detail strong').textContent;
   root.querySelectorAll('.archive-column-link').forEach(item=>item.classList.toggle('is-scrubbed',item===link));
   navigator.vibrate?.(6);
  }
  preview.classList.add('is-visible');place(x,y);
 }
 function endScrub(){
  clearTimeout(holdTimer);holdTimer=0;
  if(!scrubbing)return;
  scrubbing=false;current=null;preview.classList.remove('is-visible');root.classList.remove('is-scrubbing');
  root.querySelectorAll('.is-scrubbed').forEach(item=>item.classList.remove('is-scrubbed'));
 }
 root.addEventListener('touchstart',event=>{
  if(!touchDevice.matches||event.touches.length!==1)return endScrub();
  const touch=event.touches[0];if(!linkAt(touch.clientX,touch.clientY))return;
  startX=touch.clientX;startY=touch.clientY;suppressClick=false;
  holdTimer=setTimeout(()=>{holdTimer=0;scrubbing=true;suppressClick=true;root.classList.add('is-scrubbing');showPreview(linkAt(startX,startY),startX,startY);},220);
 },{passive:true});
 // Non-passive so an active scrub can hold the page still; before the hold fires, scrolling stays native.
 root.addEventListener('touchmove',event=>{
  const touch=event.touches[0];if(!touch)return;
  if(holdTimer&&Math.hypot(touch.clientX-startX,touch.clientY-startY)>8){clearTimeout(holdTimer);holdTimer=0;return;}
  if(!scrubbing)return;
  event.preventDefault();
  showPreview(linkAt(touch.clientX,touch.clientY),touch.clientX,touch.clientY);
 },{passive:false});
 root.addEventListener('touchend',endScrub);root.addEventListener('touchcancel',endScrub);
 root.addEventListener('contextmenu',event=>{if(scrubbing||holdTimer)event.preventDefault();});
 addEventListener('scroll',()=>{if(scrubbing)endScrub();},{passive:true});
})();
