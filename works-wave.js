(() => {
 works.forEach((w,i)=>{w.venue=String(i);w.author='';});
 // Seeded shuffle: random-looking placement stays stable after a reload.
 const venues=Array.from({length:28},(_,i)=>String(i%2));
 let seed=20260919;
 for(let i=venues.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=Math.floor(seed/4294967296*(i+1));[venues[i],venues[j]]=[venues[j],venues[i]];}
 for(let i=works.length;i<30;i++){
  const n=String(i+1).padStart(2,'0');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="hsl(${80+i*7},18%,85%)"/><text x="300" y="305" text-anchor="middle" font-family="serif" font-size="110" fill="#526963">${n}</text><text x="300" y="375" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#526963">PLACEHOLDER</text></svg>`;
  works.push({title:'仮作品 '+n,author:'',placeholder:true,venue:venues[i-2],image:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg),description:'30点での操作確認用の仮枠です。作品名・作者・画像は未登録で、会場は仮の割り振りです。'});
 }
 const venueName=w=>'会場 '+(w.venue==='0'?'A':'B');
 const section=document.querySelector('#works');
 section.querySelector('.rings').remove();section.querySelector('.works-bottom').remove();section.querySelector('#work-list').remove();
 const ui=document.createElement('div');ui.className='wave-gallery spatial-gallery';
 ui.innerHTML=`<div class="wave-toolbar"><div class="wave-filters" role="group" aria-label="会場で絞り込み"><button data-venue="all" aria-pressed="true">すべて</button><button data-venue="0" aria-pressed="false">会場 A</button><button data-venue="1" aria-pressed="false">会場 B</button></div><button class="wave-view" aria-pressed="false">一覧表示</button></div><div class="wave-stage" role="region" aria-label="作品ギャラリー。左右キーまたは横ドラッグで移動" tabindex="0"></div><div class="wave-caption" aria-live="polite"><span></span><h3></h3><button class="text-link">作品を見る ↗</button></div><div class="wave-controls"><button class="wave-prev" aria-label="前の作品">←</button><span class="wave-count" aria-live="polite"></span><button class="wave-next" aria-label="次の作品">→</button></div><div class="wave-list" hidden></div><p class="wave-note">試作：作品画像2点・会場分類は仮です</p>`;
 section.append(ui);
 ui.querySelector('.wave-note').remove();
 const search=document.createElement('div');search.className='wave-search';search.innerHTML='<label>作品を探す <input type="search" placeholder="作品名・作者名・作品番号" aria-label="作品名・作者名・作品番号で検索"></label><span role="status"></span>';ui.querySelector('.wave-toolbar').after(search);
 const empty=document.createElement('p');empty.className='wave-empty';empty.textContent='該当する作品がありません。検索条件を変えてください。';empty.hidden=true;ui.append(empty);
 const jump=document.createElement('input');jump.type='range';jump.min='0';jump.step='1';jump.setAttribute('aria-label','作品の位置を選ぶ');jump.className='wave-jump';ui.querySelector('.wave-controls').after(jump);
 const stage=ui.querySelector('.wave-stage'),list=ui.querySelector('.wave-list');
 const caption=ui.querySelector('.wave-caption'),controls=ui.querySelector('.wave-controls');
 let ids=works.map((_,i)=>i),current=0,listMode=false,drag=null,suppressUntil=0,venue='all',focused=false,hovered=-1;
 let rotation=0,inStage=false,onScreen=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const centerTitle=document.createElement('div');centerTitle.className='orbit-title';centerTitle.setAttribute('aria-hidden','true');stage.append(centerTitle);
 const logoGuide=document.createElement('img');logoGuide.className='works-logo-guide';logoGuide.src='assets/concept/iiiex2026-logo.png';logoGuide.alt='';stage.prepend(logoGuide);
 let logoPoints=[],hoveredTile=-1;
 logoGuide.decode().then(()=>{
  const c=document.createElement('canvas');c.width=c.height=180;
  const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(logoGuide,0,0,180,180);
  const data=g.getImageData(0,0,180,180).data,candidates=[];
  for(let y=0;y<180;y+=3)for(let x=0;x<180;x+=3){const k=(y*180+x)*4;if(data[k+3]>100&&data[k+1]>data[k]*1.2&&data[k+1]>70)candidates.push({x:x/180-.5,y:y/180-.5,d:Infinity});}
  if(!candidates.length)return;
  let next=candidates[Math.floor(candidates.length*.55)];
  for(let i=0;i<420;i++){
   logoPoints.push({x:next.x,y:next.y});let best=-1;
   for(const p of candidates){p.d=Math.min(p.d,(p.x-next.x)**2+(p.y-next.y)**2);if(p.d>best){best=p.d;}}
   next=candidates.find(p=>p.d===best);
  }
  logoPoints.sort((a,b)=>a.y-b.y||a.x-b.x);render();
 }).catch(()=>{});
 const back=document.createElement('button');back.className='spatial-back';back.textContent='作品群へ戻る ↙';back.onclick=()=>{focused=false;render();};caption.prepend(back);
 const status=document.createElement('div');status.className='spatial-status';status.setAttribute('aria-live','polite');stage.before(status);
 ui.querySelectorAll('[data-venue]').forEach(b=>{b.textContent=b.dataset.venue==='all'?'すべて · 30':'会場 '+(b.dataset.venue==='0'?'A':'B')+' · 15';});
 stage.setAttribute('aria-label','作品の円環。ホバーでタイトル表示、クリックで作品詳細。左右キーで作品を移動');
 const cards=works.map((w,i)=>{
  const b=document.createElement('button');b.className='wave-card';b.innerHTML=`<img src="${w.image}" alt="${w.title}" draggable="false"><small>${String(i+1).padStart(2,'0')} · ${venueName(w)}</small>`;
  b.addEventListener('click',()=>{if(performance.now()<suppressUntil)return;const n=ids.indexOf(i);if(n<0)return;current=n;openWork(i);});stage.append(b);
  b.addEventListener('pointerenter',()=>{hovered=i;render();});b.addEventListener('pointerleave',()=>{hovered=-1;render();});
  b.addEventListener('focus',()=>{current=ids.indexOf(i);focused=true;render();});b.addEventListener('blur',()=>{focused=false;render();});
  const item=document.createElement('button');item.innerHTML=`<img src="${w.image}" alt="" loading="lazy"><span><small>${String(i+1).padStart(2,'0')} · ${venueName(w)}</small>${w.title}</span>`;
  item.onclick=()=>{current=ids.indexOf(i);render();openWork(i);};list.append(item);
  return b;
 });
 const tiles=Array.from({length:420},(_,i)=>{
  const id=i%works.length,b=document.createElement('button');b.className='logo-tile';
  b.innerHTML=`<img src="${works[id].image}" alt="" draggable="false">`;
  b.setAttribute('aria-label',works[id].title+'の詳細を開く');b.tabIndex=i<30?0:-1;
  const enter=()=>{hoveredTile=i;hovered=id;render();};
  const leave=()=>{if(hoveredTile===i){hoveredTile=-1;hovered=-1;render();}};
  b.addEventListener('pointerenter',enter);b.addEventListener('pointerleave',leave);
  b.addEventListener('focus',enter);b.addEventListener('blur',leave);
  b.onclick=()=>{if(performance.now()<suppressUntil)return;current=ids.indexOf(id);openWork(id);};
  stage.append(b);return b;
 });
 function render(){
  const mobile=stage.clientWidth<600;
  const width=stage.clientWidth||700,height=stage.clientHeight||600;
  const logoMode=venue==='all';stage.classList.toggle('logo-layout',logoMode);
  logoGuide.hidden=!logoMode;
  const logoSize=Math.min(width*.98,height*1.08);stage.style.setProperty('--works-logo-size',logoSize+'px');
  const positions=works.map((w,i)=>{
   if(logoMode&&logoPoints.length){const p=logoPoints[Math.floor(i*logoPoints.length/30)];return {x:p.x*logoSize,y:p.y*logoSize-height*.055,scale:logoSize*.027/200,depth:i/30,tilt:0};}
   const n=Math.max(0,ids.indexOf(i)),count=Math.max(1,ids.length);
   const angle=n/count*Math.PI*2-Math.PI/2+rotation;
   const depth=(Math.sin(angle)+1)/2;
   const rx=width*(mobile?.36:.39),ry=height*.32;
   const x=Math.cos(angle)*rx;
   const size=Math.min(width*(count>20?.095:.145),height*(count>20?.15:.23));
   return {x,y:Math.sin(angle)*ry-x*.17,scale:size/200*(.88+depth*.2),depth,tilt:Math.cos(angle)*-12};
  });
  tiles.forEach((b,i)=>{
   const p=logoPoints[i],id=i%works.length,included=ids.includes(id);
   b.hidden=!p;if(!p)return;
   const size=Math.max(10,logoSize*.027)*(1+(i%5)*.06),active=hoveredTile===i&&logoMode;
   const target=positions[id];
   const x=logoMode?p.x*logoSize:target.x,y=logoMode?p.y*logoSize-height*.055:target.y;
   b.style.width=b.style.height=size+'px';
   b.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px)`;
   b.style.opacity=logoMode&&included?'1':'0';b.inert=!logoMode||!included;
   b.style.pointerEvents=logoMode&&included?'auto':'none';b.setAttribute('aria-hidden',String(!logoMode||!included));
   b.querySelector('img').style.transform=`scale(${active?Math.min(8,150/size):1})`;
   b.style.zIndex=active?'60':'2';b.classList.toggle('is-hovered',active);
  });
  cards.forEach((b,i)=>{
   const n=ids.indexOf(i),chosen=focused&&n===current,included=n>=0;list.children[i].hidden=!included;
   b.hidden=false;b.inert=!included||logoMode;b.setAttribute('aria-hidden',String(!included||logoMode));b.style.pointerEvents=!included||logoMode?'none':'auto';
   b.classList.toggle('is-current',chosen);b.setAttribute('aria-label',works[i].title+'・'+venueName(works[i])+'の詳細を開く');
   b.removeAttribute('aria-pressed');b.removeAttribute('aria-current');
   const p=positions[i];let x=p.x,y=p.y,scale=p.scale;
   if(!included){x+=(works[i].venue==='0'?-1:1)*width*.35;scale*=.4;}
   if(chosen||hovered===i)scale*=logoMode?2.15:1.16;
   b.style.transform=`translate(-50%,-50%) translate3d(${x}px,${y}px,0) perspective(900px) rotateY(${p.tilt}deg) rotateZ(${logoMode?0:-4}deg) scale(${scale})`;
   b.style.zIndex=chosen?40:Math.round(p.depth*20)+1;b.style.opacity=!included||logoMode?'0':'1';b.tabIndex=included&&!logoMode?0:-1;
  });
  const titleId=hovered>=0&&ids.includes(hovered)?hovered:focused?ids[current]:undefined;
  const titleText=titleId===undefined?'':works[titleId].title;
  if(centerTitle.textContent!==titleText)centerTitle.textContent=titleText;
  centerTitle.classList.toggle('is-visible',!!titleText);
  const statusText=(venue==='all'?'全作品':venue==='0'?'会場 A':'会場 B')+' · '+ids.length+'点';
  if(status.textContent!==statusText)status.textContent=statusText;
  const id=ids[current];caption.querySelector('span').textContent=id===undefined?'':venueName(works[id]);caption.querySelector('h3').textContent=id===undefined?'':works[id].title;
  search.querySelector('[role=status]').textContent=ids.length+' / '+works.length+' 点';empty.hidden=ids.length>0;
  jump.max=String(Math.max(0,ids.length-1));jump.value=String(current);jump.hidden=true;
  ui.querySelector('.wave-count').textContent=String(current+1).padStart(2,'0')+' / '+String(ids.length).padStart(2,'0');
  ui.querySelector('.wave-prev').disabled=current===0;ui.querySelector('.wave-next').disabled=current===ids.length-1;
  stage.hidden=listMode||!ids.length;caption.hidden=controls.hidden=true;list.hidden=!listMode||!ids.length;
 }
 function move(delta){if(!ids.length)return;current=Math.max(0,Math.min(ids.length-1,current+delta));(venue==='all'?tiles[ids[current]]:cards[ids[current]]).focus({preventScroll:true});}
 ui.querySelector('.wave-prev').onclick=()=>move(-1);ui.querySelector('.wave-next').onclick=()=>move(1);
 caption.querySelector('.text-link').onclick=()=>openWork(ids[current]);
 function filter(){
  const previous=ids[current],q=search.querySelector('input').value.trim().toLocaleLowerCase();
  ids=works.map((_,i)=>i).filter(i=>(venue==='all'||works[i].venue===venue)&&(!q||[works[i].title,works[i].author,String(i+1).padStart(2,'0')].join(' ').toLocaleLowerCase().includes(q)));
  current=Math.max(0,ids.indexOf(previous));focused=false;hovered=-1;hoveredTile=-1;render();
 }
 search.querySelector('input').addEventListener('input',filter);jump.oninput=()=>{current=Number(jump.value);render();};
 ui.querySelectorAll('[data-venue]').forEach(b=>b.onclick=()=>{
  venue=b.dataset.venue;
  ui.querySelectorAll('[data-venue]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));filter();
 });
 ui.querySelector('.wave-view').onclick=e=>{listMode=!listMode;e.currentTarget.setAttribute('aria-pressed',String(listMode));e.currentTarget.textContent=listMode?'空間表示':'一覧表示';render();};
 stage.addEventListener('keydown',e=>{if(e.key==='Escape'){focused=false;render();}if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});
 stage.addEventListener('click',e=>{if(e.target===stage){focused=false;render();}});
 stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,id:e.pointerId};});
 stage.addEventListener('pointermove',e=>{
  if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)){stage.setPointerCapture(e.pointerId);stage.classList.add('dragging');}
 });
 stage.addEventListener('pointerup',e=>{
  if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)){move(dx<0?1:-1);suppressUntil=performance.now()+350;}
  if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);drag=null;stage.classList.remove('dragging');
 });
 stage.addEventListener('pointercancel',()=>{drag=null;stage.classList.remove('dragging');});
 // Detail navigation and the gallery selection remain synchronized.
 dialog.addEventListener('close',()=>{const n=ids.indexOf(selected);if(n>=0)current=n;render();});
 const next=document.querySelector('#next-work');
 function detailNext(){next.disabled=ids.indexOf(selected)>=ids.length-1;}
 new MutationObserver(detailNext).observe(document.querySelector('#detail-title'),{childList:true});
 next.onclick=()=>{const n=ids.indexOf(selected);if(n>=0&&n<ids.length-1){current=n+1;render();openWork(ids[current]);detailNext();}};
 new ResizeObserver(render).observe(stage);render();
 stage.addEventListener('pointerenter',()=>{inStage=true;});stage.addEventListener('pointerleave',()=>{inStage=false;hovered=-1;render();});
 new IntersectionObserver(entries=>{onScreen=entries[0].isIntersecting;}).observe(stage);
 let previousTime=0,speed=0;
 function orbit(now){
  const dt=Math.min((now-previousTime)/1000||0,.05);previousTime=now;
  const running=venue!=='all'&&onScreen&&!document.hidden&&!listMode&&!inStage&&!focused&&!dialog.open&&!reduced.matches;
  speed+=(Number(running)-speed)*Math.min(1,dt*4);
  if(onScreen&&!listMode&&!reduced.matches&&speed>.001){rotation+=dt*speed*Math.PI*2/240;render();}
  requestAnimationFrame(orbit);
 }
 requestAnimationFrame(orbit);
})();
