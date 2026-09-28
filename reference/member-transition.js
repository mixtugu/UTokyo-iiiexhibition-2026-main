const transitionStyle=Object.assign(document.createElement('link'),{rel:'stylesheet',href:'member-transition.css?v=0927-autoplay-transition'});
document.head.append(transitionStyle);
const memberSection=document.querySelector('#members'),archiveSection=document.querySelector('#archives'),accessSection=document.querySelector('#access');
memberSection.before(accessSection);
accessSection.querySelector('.section-top span').textContent='04 / ACCESS';
memberSection.querySelector('.section-top span').textContent='05 / MEMBERS';
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
 const journey=document.createElement('div');journey.className='member-journey';
 const pin=document.createElement('div');pin.className='journey-pin';
 memberSection.before(journey);journey.append(pin);pin.append(memberSection,archiveSection);
 const art=memberSection.querySelector('.member-art');art.classList.add('particle-original');pin.append(art);
 const canvas=document.createElement('canvas');canvas.className='particle-field';canvas.width=1000;canvas.height=580;canvas.setAttribute('aria-hidden','true');pin.append(canvas);
 const ctx=canvas.getContext('2d');
 const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
 let pairs=[],ready=false,prepared=false,queued=false,markerStarted=false,prepareVersion=0;
 let progress=location.hash==='#archives'?1:0,target=progress,from=progress,tweenStart=0,tweenDuration=0;
 function key(x,y){let n=0;for(let i=0;i<10;i++)n|=((x>>i)&1)<<(2*i)|((y>>i)&1)<<(2*i+1);return n;}
 function sample(img){
  const c=document.createElement('canvas');c.width=1000;c.height=580;
  const sourceWidth=img.naturalWidth||img.width,sourceHeight=img.naturalHeight||img.height;
  const g=c.getContext('2d',{willReadFrequently:true}),s=Math.min(1000/sourceWidth,580/sourceHeight),w=sourceWidth*s,h=sourceHeight*s;
  g.drawImage(img,(1000-w)/2,(580-h)/2,w,h);
  const data=g.getImageData(0,0,1000,580).data,points=[];
  for(let y=0;y<580;y+=2)for(let x=0;x<1000;x+=2){const i=(y*1000+x)*4;if(data[i+3]>30&&Math.min(data[i],data[i+1],data[i+2])<225)points.push({x,y,r:data[i],g:data[i+1],b:data[i+2],a:data[i+3]/255,key:key(x,y)});}
  return points.sort((a,b)=>a.key-b.key);
 }
 function markerPoints(){
  if(!window.membersMarkerSourcePoints)return null;
  const bytes=atob(window.membersMarkerSourcePoints),points=[];
  const sourceScale=Math.min(1000/1675,580/939),top=(580-939*sourceScale)/2;
  for(let i=0;i<bytes.length;i+=4){
   const x=bytes.charCodeAt(i)+bytes.charCodeAt(i+1)*256;
   const y=bytes.charCodeAt(i+2)+bytes.charCodeAt(i+3)*256;
   const px=Math.round(x*sourceScale),py=Math.round(top+y*sourceScale);
   points.push({x:px,y:py,r:32,g:163,b:95,a:1,key:key(px,py)});
  }
  return points.sort((a,b)=>a.key-b.key);
 }
 function archivePoints(){
  const viewport=archiveSection.querySelector('.archive-viewport');
  const field=canvas.getBoundingClientRect(),visible=viewport.getBoundingClientRect();
  if(!field.width||!field.height||!visible.width||!visible.height)return [];
  const target=document.createElement('canvas');target.width=1000;target.height=580;
  const ink=target.getContext('2d',{willReadFrequently:true});
  const toX=x=>(x-field.left)/field.width*1000,toY=y=>(y-field.top)/field.height*580;
  const regions=[];
  archiveSection.querySelectorAll('.archive-column-link').forEach((link,index)=>{
   const box=link.getBoundingClientRect(),image=link.querySelector('img');
   const left=Math.max(box.left,visible.left),right=Math.min(box.right,visible.right);
   const top=Math.max(box.top,visible.top),bottom=Math.min(box.bottom,visible.bottom);
   if(right<=left||bottom<=top)return;
   const x=toX(box.left),y=toY(box.top),width=box.width/field.width*1000,height=box.height/field.height*580;
   const region={left:Math.max(0,toX(left)),right:Math.min(1000,toX(right)),top:Math.max(0,toY(top)),bottom:Math.min(580,toY(bottom)),index};
   if(region.right<=region.left||region.bottom<=region.top)return;
   regions.push(region);
   if(!image.complete||!image.naturalWidth)return;
   const scale=Math.max(width/image.naturalWidth,height/image.naturalHeight);
   const drawnWidth=image.naturalWidth*scale,drawnHeight=image.naturalHeight*scale;
   ink.save();ink.beginPath();ink.rect(region.left,region.top,region.right-region.left,region.bottom-region.top);ink.clip();
   ink.drawImage(image,x+(width-drawnWidth)/2,y+(height-drawnHeight)/2,drawnWidth,drawnHeight);
   ink.restore();
  });
  let pixels;
  try{pixels=ink.getImageData(0,0,1000,580).data;}catch(error){pixels=null;}
  const fallback=[[74,108,76],[112,151,112],[75,116,137],[153,144,102],[105,133,94]];
  const points=[];
  for(const region of regions){
   const color=fallback[region.index%fallback.length];
   for(let y=Math.ceil(region.top/4)*4;y<region.bottom;y+=4){
    for(let x=Math.ceil(region.left/4)*4;x<region.right;x+=4){
     const i=(y*1000+x)*4,hasPixel=pixels&&pixels[i+3]>40;
     points.push({x,y,r:hasPixel?pixels[i]:color[0],g:hasPixel?pixels[i+1]:color[1],b:hasPixel?pixels[i+2]:color[2],a:1,key:key(x,y)});
    }
   }
  }
  return points.sort((a,b)=>a.key-b.key);
 }
 async function prepare(){
  const version=++prepareVersion;
  try{
   const image=window.membersMarkerPrototype?.artwork||await new Promise(resolve=>{
    addEventListener('members-marker-ready',()=>resolve(window.membersMarkerPrototype.artwork),{once:true});
   });
   const archiveImages=[...archiveSection.querySelectorAll('.archive-column-link img')];
   archiveImages.forEach(img=>{img.loading='eager';});
   await Promise.allSettled(archiveImages.map(img=>img.decode()));
   if(version!==prepareVersion)return;
   const a=sample(image),b=archivePoints();if(!a.length||!b.length)throw Error('Empty artwork');
   const count=Math.min(innerWidth<700?4500:9000,Math.max(a.length,b.length));
   pairs=Array.from({length:count},(_,i)=>({a:a[Math.floor(i*a.length/count)],b:b[Math.floor(i*b.length/count)],seed:Math.sin(i*127.1+19.7)}));
   ready=true;prepared=true;update();
  }catch(error){console.warn('Particle artwork unavailable',error);prepared=true;update();}
 }
 function aim(next,now){
  if(next===target)return;
  if(next&&window.membersMarkerPrototype){
   window.membersMarkerPrototype.pause();
   // Start from the ink actually visible now, never wait for the intro to finish.
   const visible=sample(window.membersMarkerPrototype.canvas);
   if(visible.length)pairs.forEach((pair,i)=>{pair.a=visible[Math.floor(i*visible.length/pairs.length)];});
  }
  if(!next&&window.membersMarkerPrototype)window.membersMarkerPrototype.complete();
  target=next;from=progress;tweenStart=now;
  tweenDuration=Math.max(1,(next?1650:1050)*Math.abs(next-from));
 }
 function render(now){
  queued=false;
  const journeyRect=journey.getBoundingClientRect();
  const scrollOffset=-journeyRect.top;
  if(journeyRect.bottom<0||journeyRect.top>innerHeight){return;}
  if(!markerStarted&&journeyRect.top<=innerHeight*.8&&window.membersMarkerPrototype){
   markerStarted=true;window.membersMarkerPrototype.restart();
  }
  if(prepared&&scrollOffset>24)aim(1,now);
  else if(scrollOffset<12)aim(0,now);
  if(tweenDuration){
   const elapsed=clamp((now-tweenStart)/tweenDuration);
   progress=from+(target-from)*ease(elapsed);
   if(elapsed===1){progress=target;tweenDuration=0;}
  }
  const p=progress;
  const dissolve=ease(p/.18),travel=ease(p/.88),settle=ease((p-.79)/.21),af=ease((p-.73)/.15),mf=1-ease(p/.35);
  const archiveGallery=ease((p-.84)/.12);
  pin.style.setProperty('--journey-progress',p);pin.style.setProperty('--member-opacity',mf);pin.style.setProperty('--archive-opacity',af);
  pin.style.setProperty('--archive-gallery-opacity',archiveGallery);
  pin.style.setProperty('--archive-contour-opacity',0);
  pin.style.setProperty('--heading-out',(-25*(1-mf))+'px');pin.style.setProperty('--heading-in',(20*(1-af))+'px');
  art.style.opacity=ready?1-dissolve:1-af;canvas.style.opacity=ready?dissolve*(1-settle):0;
  ctx.clearRect(0,0,1000,580);
  if(ready&&dissolve>0&&settle<1){
   const cloud=Math.sin(travel*Math.PI);
   for(const {a,b,seed} of pairs){
    const x=a.x+(b.x-a.x)*travel+cloud*seed*32,y=a.y+(b.y-a.y)*travel+cloud*Math.cos(seed*12)*22;
    const r=Math.round(a.r+(b.r-a.r)*travel),g=Math.round(a.g+(b.g-a.g)*travel),blue=Math.round(a.b+(b.b-a.b)*travel);
    ctx.fillStyle='rgba('+r+','+g+','+blue+','+(a.a+(b.a-a.a)*travel)+')';
    const size=1.6+cloud*.35+travel*.7;ctx.fillRect(x-size/2,y-size/2,size,size);
   }
  }
  const active=p>.92;archiveSection.inert=!active;archiveSection.setAttribute('aria-hidden',!active);memberSection.setAttribute('aria-hidden',mf<.05);art.setAttribute('aria-hidden',dissolve>.95);
  archiveSection.style.pointerEvents=active?'auto':'none';
  if(tweenDuration)update();
 }
 function update(){if(!queued){queued=true;requestAnimationFrame(render);}}
 let resizeTimer;
 addEventListener('scroll',update,{passive:true});
 addEventListener('members-marker-complete',update);
 addEventListener('resize',()=>{update();clearTimeout(resizeTimer);resizeTimer=setTimeout(prepare,180);});
 archiveSection.addEventListener('archives-group-change',prepare);
 transitionStyle.addEventListener('load',update);
 function navigate(id,behavior='smooth'){scrollTo({top:journey.getBoundingClientRect().top+scrollY+(id==='archives'?(journey.offsetHeight-pin.offsetHeight)*.94:0),behavior});}
 document.querySelectorAll('a[href="#members"],a[href="#archives"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();history.pushState(null,'',a.hash);navigate(a.hash.slice(1));}));
 addEventListener('hashchange',()=>{if(['#members','#archives'].includes(location.hash))navigate(location.hash.slice(1));});
 addEventListener('load',()=>{if(['#members','#archives'].includes(location.hash))navigate(location.hash.slice(1),'instant');update();});
 prepare();update();
}

// Announce and Access stay behind the next full-height chapter. The existing
// Members/Archives journey keeps its own sticky pin and scroll measurements.
(() => {
 const announce=document.querySelector('#announce');
 const memberJourney=document.querySelector('.member-journey');
 if(!announce||!memberJourney)return;
 const stack=document.createElement('div');stack.className='chapter-stack';
 announce.before(stack);stack.append(announce,accessSection,memberJourney);
 function fit(){
  for(const section of [announce,accessSection]){
   // On short screens let all content pass before pinning the bottom edge.
   section.style.setProperty('--chapter-pin-top',Math.min(0,innerHeight-section.offsetHeight)+'px');
  }
 }
 const resize=new ResizeObserver(fit);resize.observe(announce);resize.observe(accessSection);
 addEventListener('resize',fit);fit();
 function navigateChapter(id,behavior='smooth'){
  const top=stack.getBoundingClientRect().top+scrollY+(id==='access'?announce.offsetHeight:0);
  scrollTo({top,behavior});
 }
 document.querySelectorAll('a[href="#announce"],a[href="#access"]').forEach(link=>link.addEventListener('click',event=>{
  event.preventDefault();history.pushState(null,'',link.hash);navigateChapter(link.hash.slice(1));
 }));
 addEventListener('hashchange',()=>{if(['#announce','#access'].includes(location.hash))navigateChapter(location.hash.slice(1));});
 addEventListener('load',()=>{if(['#announce','#access'].includes(location.hash))navigateChapter(location.hash.slice(1),'instant');});
})();
