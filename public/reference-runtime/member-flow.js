(() => {
 const members=document.querySelector('#members'),archives=document.querySelector('#archives'),art=members.querySelector('.member-art'),gallery=archives.querySelector('.archive-columns');
 members.before(document.querySelector('#access'));
 members.classList.add('members-natural');archives.classList.add('archives-natural');
 // Phones show members and archives without animation or programmatic scrolling.
 const touch=matchMedia('(hover: none) and (pointer: coarse), (max-width: 767px)');
 let navigatingUntil=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 canvas.className='members-flow-particles';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 let started=false,done=false,running=false,requested=false,frame=0,particles=[],start=0;
 const clamp=x=>Math.max(0,Math.min(1,x));
 let peelSource=null;
 let entryTimer=0;
 let scrollFrom=0,scrollToY=0;
 let entryFrame=0,entryActive=false,entryGuard=0,lastY=scrollY,entryCooldown=0;
 function releaseEntry(){
  cancelAnimationFrame(entryFrame);clearTimeout(entryGuard);entryFrame=0;entryActive=false;window.memberEntryScroll=false;
 }
 function enterMembers(){
  const marker=window.membersMarkerPrototype;if(!marker||entryActive)return;
  clearTimeout(entryTimer);entryTimer=0;entryActive=true;window.memberEntryScroll=true;
  dispatchEvent(new Event('member-auto-scroll'));
  const from=scrollY,to=members.getBoundingClientRect().top+scrollY,at=performance.now();
  // Ease into a full, readable viewport before starting the actual drawing.
  function settle(now){
   const p=clamp((now-at)/720),t=1-Math.pow(1-p,3);
   scrollTo({top:from+(to-from)*t,behavior:'instant'});
   if(p<1){entryFrame=requestAnimationFrame(settle);return;}
   entryFrame=0;started=true;done=false;requested=false;art.style.visibility='';art.style.opacity='1';marker.restart();
  }
  entryFrame=requestAnimationFrame(settle);
  // Never retain scroll control if the marker cannot finish loading/rendering.
  entryGuard=setTimeout(releaseEntry,6500);
 }
 art.style.visibility='hidden';
 function begin(){
  const marker=window.membersMarkerPrototype;if(running||done||!marker?.finished)return;
  if(archives.getBoundingClientRect().top < -innerHeight*.2)return;
  const source=marker.canvas,rect=source.getBoundingClientRect(),sample=document.createElement('canvas');sample.width=480;sample.height=270;
  const g=sample.getContext('2d',{willReadFrequently:true});g.drawImage(source,0,0,480,270);const data=g.getImageData(0,0,480,270).data;
  // Draw from a GPU copy; phones use a coarser grid (a quarter of the particles).
  peelSource=document.createElement('canvas');peelSource.width=480;peelSource.height=270;peelSource.getContext('2d').drawImage(sample,0,0);
  const step=innerWidth<700?4:2;
  const targets=[...archives.querySelectorAll('.archive-rail img')].map(img=>img.getBoundingClientRect()).filter(r=>r.width>0);
  const fallback=gallery.getBoundingClientRect();if(!targets.length)targets.push(fallback);
  particles=[];
  for(let y=0;y<270;y+=step)for(let x=0;x<480;x+=step){const i=(y*480+x)*4;if(data[i+3]<16)continue;const t=targets[particles.length%targets.length];
   const patch=(Math.sin(Math.floor(x/22)*2.7+Math.floor(y/18)*4.1)+1)/2;
   const delay=(y/270)*.1+patch*.07+Math.random()*.05;
   particles.push({sx:x,sy:y,size:step,w:rect.width*step/480,h:rect.height*step/270,x:rect.left+x/480*rect.width,y:rect.top+scrollY+y/270*rect.height,tx:t.left+Math.random()*t.width,ty:t.top+scrollY+Math.random()*t.height,delay,duration:.64+Math.random()*.08,drift:(Math.random()-.5)*70,color:`rgb(${data[i]},${data[i+1]},${data[i+2]})`});}
  scrollFrom=scrollY;
  scrollToY=Math.max(scrollFrom,Math.min(document.documentElement.scrollHeight-innerHeight,archives.getBoundingClientRect().top+scrollY));
  canvas.width=innerWidth;canvas.height=innerHeight;start=performance.now();running=true;
  window.memberAutoScroll=true;dispatchEvent(new Event('member-auto-scroll'));
  gallery.style.opacity='0';art.style.visibility='hidden';frame=requestAnimationFrame(draw);
 }
 function draw(now){
  const p=clamp((now-start)/2400);ctx.clearRect(0,0,canvas.width,canvas.height);
  // Start moving immediately, then settle gently as the fragments reach the images.
  const travel=p+p*p-p*p*p;
  scrollTo({top:scrollFrom+(scrollToY-scrollFrom)*travel,behavior:'instant'});
  art.style.opacity='0';gallery.style.opacity=String(clamp((p-.94)/.06));
  for(const dot of particles){const age=clamp((p-dot.delay)/dot.duration),t=age*age*(3-2*age);
   const x=dot.x+(dot.tx-dot.x)*t+Math.sin(t*Math.PI)*dot.drift,y=dot.y+(dot.ty-dot.y)*t-scrollY-Math.sin(t*Math.PI)*28;
   ctx.globalAlpha=1-clamp((p-.94)/.06);
   // Each ink fragment stays in place until its own release, then immediately flows onward.
   const shrink=clamp(age*5),w=dot.w+(3-dot.w)*shrink,h=dot.h+(3-dot.h)*shrink;
   ctx.drawImage(peelSource,dot.sx,dot.sy,dot.size,dot.size,x,y,w,h);
  }
  if(p<1)frame=requestAnimationFrame(draw);else{running=false;done=true;window.memberAutoScroll=false;ctx.clearRect(0,0,canvas.width,canvas.height);gallery.style.opacity='1';}
 }
 function update(){
  const marker=window.membersMarkerPrototype;if(!marker)return;
  const r=members.getBoundingClientRect(),a=archives.getBoundingClientRect();
  if(!r.height)return;
  if(reduced.matches||touch.matches){art.style.visibility='';art.style.opacity='1';gallery.style.opacity='1';return;}
  const downward=scrollY>lastY+1;lastY=scrollY;
  if(entryActive)return;
  const navigating=performance.now()<navigatingUntil;
  if(!navigating&&!started&&!running&&downward&&performance.now()>entryCooldown&&r.top<innerHeight*.65&&r.top>-innerHeight*.25){enterMembers();return;}
  const inPosition=r.top<=innerHeight*.18&&r.top>=-innerHeight*.25&&r.bottom>=innerHeight*.65;
  if(!started&&inPosition&&!entryTimer){entryTimer=setTimeout(()=>{entryTimer=0;const b=members.getBoundingClientRect();if(b.top<=innerHeight*.18&&b.top>=-innerHeight*.25&&b.bottom>=innerHeight*.65){started=true;art.style.visibility='';art.style.opacity='1';marker.restart();}},180);}
  if(!inPosition){clearTimeout(entryTimer);entryTimer=0;}
  if(!running&&(r.bottom<=0||r.top>=innerHeight)){marker.pause();started=false;requested=false;art.style.visibility='hidden';}
  if(!navigating&&started&&a.top<innerHeight*.95&&!done&&!running){requested=true;if(marker.finished)begin();}
  if(a.top>=innerHeight){if(running){cancelAnimationFrame(frame);running=false;window.memberAutoScroll=false;ctx.clearRect(0,0,canvas.width,canvas.height);}done=false;requested=false;art.style.visibility=started?'':'hidden';art.style.opacity='1';gallery.style.opacity='1';}
 }
 addEventListener('scroll',update,{passive:true});addEventListener('resize',update);
 addEventListener('members-marker-ready',update);addEventListener('members-marker-complete',()=>{if(entryActive){releaseEntry();return;}if(requested&&!reduced.matches&&!touch.matches&&performance.now()>=navigatingUntil)begin();});update();
 // In-page links scroll past #members; the automatic entry must not capture them.
 document.addEventListener('click',e=>{if(e.target.closest?.('a[href^="#"]'))navigatingUntil=performance.now()+2500;},true);
 touch.addEventListener('change',update);
 function interrupt(){if(entryActive){releaseEntry();entryCooldown=performance.now()+1200;}if(!running)return;cancelAnimationFrame(frame);running=false;done=true;requested=false;window.memberAutoScroll=false;ctx.clearRect(0,0,canvas.width,canvas.height);art.style.visibility='';art.style.opacity='1';gallery.style.opacity='1';}
 addEventListener('keydown',e=>{if(entryActive&&['ArrowDown','PageDown',' '].includes(e.key)&&!e.target.closest('button,a,input,textarea,select'))e.preventDefault();});
 addEventListener('pointerdown',interrupt,{passive:true});addEventListener('touchstart',interrupt,{passive:true});
 addEventListener('wheel',e=>{if(e.deltaY<0)interrupt();},{passive:true});addEventListener('hashchange',interrupt);addEventListener('keydown',e=>{if(['ArrowUp','PageUp','Home'].includes(e.key))interrupt();});addEventListener('resize',interrupt);reduced.addEventListener('change',interrupt);
})();
