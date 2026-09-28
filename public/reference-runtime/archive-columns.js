(() => {
 const records = [
  ['本展','2025','あることないこと','https://2025-main.pages.dev/','main-2025-visual.jpg'],
  ['本展','2024','付いて離れて','https://2024-main.pages.dev/','main-2024-visual.webp'],
  ['本展','2023','學藝運動','https://iii-exhibition2023-main.vercel.app/','../main-2023.png'],
  ['本展','2022','Emulsion','https://archive.iiiexhibition.com/log/i3e24','main-2022-visual.webp'],
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
  ['番外展','2025','あることないこと','https://iii-exhibition2025-beginning.pages.dev','extra-2025-visual.png'],
  ['番外展','2024','なにいう展','https://iii-exhibition-2024-web.vercel.app/','../extra-2024.png'],
  ['番外展','2023','voidage','https://iii-exhibition2023.vercel.app/','../extra-2023.jpg'],
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
 const tabs=document.createElement('div');tabs.className='archive-tabs';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','アーカイブの種類');
 const viewport=document.createElement('div');viewport.className='archive-viewport';
 const rail=document.createElement('div');rail.className='archive-rail';rail.setAttribute('aria-label','過去の制作展');viewport.append(rail);
 root.append(tabs,viewport);
 // Keep the particles outside the clipped photo strip so its rectangle can dissolve.
 const particleCanvas=document.createElement('canvas');particleCanvas.className='archive-switch-particles';particleCanvas.setAttribute('aria-hidden','true');document.body.append(particleCanvas);
 const particleContext=particleCanvas.getContext('2d');
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 let active=null,currentGroup=null,switching=false,pendingGroup=null;
 const groupLoads=new Map();
 function expand(column){
  active=column;
  rail.classList.toggle('has-active',!!column);
  rail.querySelectorAll('.archive-column-link').forEach(link=>link.classList.toggle('is-active',link===column));
 }
 function show(group,notify=true){
  expand(null);rail.replaceChildren();
  const entries=records.filter(record=>record[0]===group);
  rail.style.setProperty('--column-count',entries.length);
  entries.forEach(([,year,title,url,image],index)=>{
   const link=document.createElement('a');link.className='archive-column-link';link.href=url;link.target='_blank';link.rel='noopener noreferrer';
   if(switching)link.style.opacity='0';
   link.setAttribute('aria-label',`${year}年 ${title} のサイトを開く`);
   const photo=document.createElement('img');photo.src='assets/archive/imported/'+image;photo.alt='';photo.loading=switching?'eager':'lazy';
   const label=document.createElement('span');label.className='archive-column-label';
   const number=document.createElement('span');number.className='archive-column-year';number.textContent=year;
   const detail=document.createElement('span');detail.className='archive-column-detail';
   const name=document.createElement('strong');name.textContent=title;
   const arrow=document.createElement('span');arrow.textContent='サイトを見る ↗';detail.append(name,arrow);label.append(number,detail);link.append(photo,label);
   link.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'||event.pointerType==='pen')expand(link);});
   link.addEventListener('focus',()=>{if(matchMedia('(hover: hover)').matches)expand(link);});
   link.addEventListener('click',event=>{
    if(matchMedia('(hover: none)').matches&&active!==link){event.preventDefault();expand(link);}
   });
   rail.append(link);
  });
  currentGroup=group;
  viewport.scrollLeft=0;
  tabs.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.group===group)));
  if(notify)root.dispatchEvent(new CustomEvent('archives-group-change',{bubbles:true}));
 }
 function captureParticles(){
  const width=viewport.clientWidth,height=viewport.clientHeight;
  particleCanvas.width=innerWidth;particleCanvas.height=innerHeight;
  if(!width||!height)return [];
  const source=document.createElement('canvas');source.width=width;source.height=height;
  const ink=source.getContext('2d',{willReadFrequently:true});
  const viewportBox=viewport.getBoundingClientRect(),regions=[];
  const fallback=[[72,105,73],[102,130,105],[86,111,121],[119,125,95],[92,118,86]];
  rail.querySelectorAll('.archive-column-link').forEach((link,index)=>{
   const box=link.getBoundingClientRect(),image=link.querySelector('img');
   const x=box.left-viewportBox.left,y=box.top-viewportBox.top;
   regions.push({left:x,right:x+box.width,color:fallback[index%fallback.length]});
   ink.fillStyle='#183b29';ink.fillRect(x,y,box.width,box.height);
   if(!image.complete||!image.naturalWidth)return;
   const scale=Math.max(box.width/image.naturalWidth,box.height/image.naturalHeight);
   const drawnWidth=image.naturalWidth*scale,drawnHeight=image.naturalHeight*scale;
   ink.save();ink.beginPath();ink.rect(x,y,box.width,box.height);ink.clip();
   ink.drawImage(image,x+(box.width-drawnWidth)/2,y+(box.height-drawnHeight)/2,drawnWidth,drawnHeight);
   ink.restore();
  });
  let pixels;
  try{pixels=ink.getImageData(0,0,width,height).data;}catch(error){pixels=null;}
  const budget=innerWidth<700?4000:10000;
  const step=Math.max(3,Math.sqrt(width*height/budget)),particles=[];
  for(let y=step/2;y<height;y+=step){
   for(let x=step/2;x<width;x+=step){
    const region=regions.find(item=>x>=item.left&&x<item.right);
    if(!region)continue;
    const offset=(Math.floor(y)*width+Math.floor(x))*4;
    if(pixels&&pixels[offset+3]<25)continue;
    const base=pixels?[pixels[offset],pixels[offset+1],pixels[offset+2]]:region.color;
    const color=base.map((value,i)=>Math.round(value*.73+[11,38,28][i]*.27));
    const seed=Math.sin(x*12.9898+y*78.233)*43758.5453;
    const random=seed-Math.floor(seed);
    const seed2=Math.sin(x*39.346+y*11.135)*31837.719;
    const drift=seed2-Math.floor(seed2);
    const edge=Math.min(x,width-x,y,height-y);
    const edgeBlend=Math.min(1,edge/55);
    particles.push({
     x:viewportBox.left+x,y:viewportBox.top+y,paint:`rgb(${color[0]} ${color[1]} ${color[2]})`,
     dx:(random-.5)*150+(x/width-.5)*130,
     dy:(drift-.5)*80+(y/height-.5)*160-28,
     size:.8+random*.65,phase:drift*.18+(1-edgeBlend)*random*.27,
     edgeOpacity:.35+.65*edgeBlend,speed:.85+random*.35
    });
   }
  }
  return particles;
 }
 function dissolve(particles){
  return new Promise(resolve=>{
   const duration=260,start=performance.now(),startScrollX=scrollX,startScrollY=scrollY;
   rail.classList.add('is-dissolving');particleCanvas.classList.add('is-visible');
   function frame(now){
    const t=Math.min(1,(now-start)/duration);
    particleContext.clearRect(0,0,particleCanvas.width,particleCanvas.height);
    for(const particle of particles){
     const {x,y,paint,dx,dy,size,phase,speed,edgeOpacity}=particle;
     const progress=Math.min(1,t+phase*(1-t)+(speed-1)*t*(1-t)*2);
     if(progress>=1)continue;
     particleContext.globalAlpha=edgeOpacity*Math.pow(1-progress,1.15);
     particleContext.fillStyle=paint;
     const side=size*(1-progress*.35);
     particleContext.fillRect(x+startScrollX-scrollX+dx*progress-side/2,y+startScrollY-scrollY+dy*progress-side/2,side,side);
    }
    particleContext.globalAlpha=1;
    if(t<1)requestAnimationFrame(frame);
    else{particleCanvas.classList.remove('is-visible');particleContext.clearRect(0,0,particleCanvas.width,particleCanvas.height);resolve();}
   }
   requestAnimationFrame(frame);
  });
 }
 function form(particles){
  return new Promise(resolve=>{
   const duration=600,start=performance.now(),startScrollX=scrollX,startScrollY=scrollY;
   const viewportBox=viewport.getBoundingClientRect(),width=Math.max(1,viewportBox.width);
   const columns=[...rail.querySelectorAll('.archive-column-link')];
   particleCanvas.classList.add('is-visible');
   const ease=value=>value*value*(3-2*value);
   function frame(now){
    const t=Math.min(1,(now-start)/duration);
    particleContext.clearRect(0,0,particleCanvas.width,particleCanvas.height);
    columns.forEach((column,index)=>{
     const delay=.56+index/Math.max(1,columns.length-1)*.35;
     const reveal=Math.max(0,Math.min(1,(t-delay)/.09));
     column.style.opacity=String(ease(reveal));
    });
    for(const particle of particles){
     const {x,y,paint,dx,dy,size,phase,edgeOpacity}=particle;
     const across=Math.max(0,Math.min(1,(x-viewportBox.left)/width));
     const delay=.05+across*.37+phase*.14;
     const local=Math.max(0,Math.min(1,(t-delay)/.53));
     if(local===0||local===1)continue;
     const settled=ease(local);
     particleContext.globalAlpha=edgeOpacity*Math.min(1,local*4)*(1-ease(Math.max(0,Math.min(1,(local-.82)/.18))));
     particleContext.fillStyle=paint;
     const side=size*(.8+settled*.3);
     particleContext.fillRect(x+startScrollX-scrollX+dx*(1-settled)-side/2,y+startScrollY-scrollY+dy*(1-settled)-side/2,side,side);
    }
    particleContext.globalAlpha=1;
    if(t<1)requestAnimationFrame(frame);
    else{particleCanvas.classList.remove('is-visible');particleContext.clearRect(0,0,particleCanvas.width,particleCanvas.height);columns.forEach(column=>column.style.removeProperty('opacity'));resolve();}
   }
   requestAnimationFrame(frame);
  });
 }
 function preloadGroup(group){
  if(groupLoads.has(group))return groupLoads.get(group);
  const loads=records.filter(record=>record[0]===group).map(record=>{
   const image=new Image();image.src='assets/archive/imported/'+record[4];
   return image.decode().catch(()=>{});
  });
  const loaded=Promise.all(loads);groupLoads.set(group,loaded);return loaded;
 }
 async function switchGroup(group){
  if(switching){pendingGroup=group;return;}
  if(group===currentGroup)return;
  if(reducedMotion.matches){show(group);return;}
  switching=true;root.setAttribute('aria-busy','true');
  await preloadGroup(group);
  rail.classList.add('is-forming');
  show(group,false);
  await Promise.allSettled([...rail.querySelectorAll('img')].map(image=>image.decode()));
  const columns=[...rail.children];
  // A compositor-only left-to-right reveal; no particle sampling or canvas work.
  await Promise.all(columns.map((column,i)=>{
   column.style.opacity='1';
   const animation=column.animate([{opacity:0,clipPath:'inset(0 100% 0 0)'},{opacity:1,clipPath:'inset(0 0% 0 0)'}],{duration:150,delay:i/Math.max(1,columns.length-1)*100,easing:'cubic-bezier(.2,.7,.3,1)',fill:'both'});
   return animation.finished.catch(()=>{}).then(()=>{animation.cancel();column.style.removeProperty('opacity');});
  }));
  rail.classList.remove('is-forming');root.removeAttribute('aria-busy');switching=false;
  root.dispatchEvent(new CustomEvent('archives-group-change',{bubbles:true}));
  const next=pendingGroup;pendingGroup=null;if(next&&next!==currentGroup)switchGroup(next);
 }
 function morph(outgoing,incoming){
  return new Promise(resolve=>{
   const start=performance.now(),duration=200,sy=scrollY,sx=scrollX;
   const columns=[...rail.children],count=Math.max(outgoing.length,incoming.length);
   const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
   particleCanvas.classList.add('is-visible');
   function tick(now){
    const t=Math.min(1,(now-start)/duration),blend=smooth(t/.55);
    particleContext.clearRect(0,0,particleCanvas.width,particleCanvas.height);
    for(let i=0;i<count;i++){
     const a=outgoing[Math.floor(i*outgoing.length/count)],b=incoming[Math.floor(i*incoming.length/count)];
     if(!a||!b)continue;
     const settle=smooth((t-.88)/.12);
     const x=a.x+(b.x-a.x)*blend+sx-scrollX;
     const y=a.y+(b.y-a.y)*blend+sy-scrollY;
     particleContext.globalAlpha=(1-settle)*(1-blend);
     particleContext.fillStyle=a.paint;
     particleContext.fillRect(x,y,a.size,a.size);
     particleContext.globalAlpha=blend*(1-settle);
     particleContext.fillStyle=b.paint;particleContext.fillRect(x,y,b.size,b.size);
    }
    columns.forEach(column=>{column.style.opacity=String(smooth((t-.88)/.12));});
    particleContext.globalAlpha=1;
    if(t<1)requestAnimationFrame(tick);
    else{particleCanvas.classList.remove('is-visible');particleContext.clearRect(0,0,particleCanvas.width,particleCanvas.height);columns.forEach(c=>{c.style.removeProperty('opacity');c.style.removeProperty('transform');});resolve();}
   }
   requestAnimationFrame(tick);
  });
 }
 for(const [group,label] of [['本展','iii exhibition'],['番外展','beginning']]){
  const button=document.createElement('button');button.type='button';button.dataset.group=group;button.textContent=label;
  button.addEventListener('click',()=>switchGroup(group));tabs.append(button);
 }
 rail.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'||event.pointerType==='pen')expand(null);});
 root.addEventListener('focusout',event=>{if(!root.contains(event.relatedTarget)&&matchMedia('(hover: hover)').matches)expand(null);});
 show('本展');
 preloadGroup('番外展');
 preloadGroup('本展');
})();
