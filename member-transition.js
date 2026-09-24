const transitionStyle=Object.assign(document.createElement('link'),{rel:'stylesheet',href:'member-transition.css'});
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
 const image=art.querySelector('img');image.loading='eager';
 const canvas=document.createElement('canvas');canvas.className='particle-field';canvas.width=1000;canvas.height=580;canvas.setAttribute('aria-hidden','true');pin.append(canvas);
 const ctx=canvas.getContext('2d');
 const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
 let pairs=[],ready=false,queued=false;
 function key(x,y){let n=0;for(let i=0;i<10;i++)n|=((x>>i)&1)<<(2*i)|((y>>i)&1)<<(2*i+1);return n;}
 function sample(img){
  const c=document.createElement('canvas');c.width=1000;c.height=580;
  const g=c.getContext('2d',{willReadFrequently:true}),s=Math.min(1000/img.naturalWidth,580/img.naturalHeight),w=img.naturalWidth*s,h=img.naturalHeight*s;
  g.drawImage(img,(1000-w)/2,(580-h)/2,w,h);
  const data=g.getImageData(0,0,1000,580).data,points=[];
  for(let y=0;y<580;y+=2)for(let x=0;x<1000;x+=2){const i=(y*1000+x)*4;if(data[i+3]>30&&Math.min(data[i],data[i+1],data[i+2])<225)points.push({x,y,r:data[i],g:data[i+1],b:data[i+2],a:data[i+3]/255,key:key(x,y)});}
  return points.sort((a,b)=>a.key-b.key);
 }
 async function prepare(){
  try{
   await image.decode();
   const d=document.querySelector('#contour').getAttribute('d');
   const paths='<path d="'+d+'"/>';
   const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="580"><g fill="none" stroke="#40b83a" stroke-width="1.2">'+paths+'</g></svg>';
   const target=new Image();target.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await target.decode();
   const a=sample(image),b=sample(target);if(!a.length||!b.length)throw Error('Empty artwork');
   const count=Math.min(14000,Math.max(a.length,b.length));
   pairs=Array.from({length:count},(_,i)=>({a:a[Math.floor(i*a.length/count)],b:b[Math.floor(i*b.length/count)],seed:Math.sin(i*127.1+19.7)}));
   ready=true;update();
  }catch(error){console.warn('Particle artwork unavailable',error);update();}
 }
 function render(){
  queued=false;
  const p=clamp(-journey.getBoundingClientRect().top/Math.max(1,journey.offsetHeight-pin.offsetHeight));
  const dissolve=ease((p-.1)/.1),travel=ease((p-.2)/.52),settle=ease((p-.74)/.1),af=ease((p-.74)/.1),mf=1-ease((p-.23)/.25);
  pin.style.setProperty('--journey-progress',p);pin.style.setProperty('--member-opacity',mf);pin.style.setProperty('--archive-opacity',af);
  pin.style.setProperty('--heading-out',(-25*(1-mf))+'px');pin.style.setProperty('--heading-in',(20*(1-af))+'px');
  art.style.opacity=ready?1-dissolve:1-af;canvas.style.opacity=ready?dissolve*(1-settle):0;
  ctx.clearRect(0,0,1000,580);
  if(ready&&dissolve>0&&settle<1){
   const cloud=Math.sin(travel*Math.PI);
   for(const {a,b,seed} of pairs){
    const x=a.x+(b.x-a.x)*travel+cloud*seed*32,y=a.y+(b.y-a.y)*travel+cloud*Math.cos(seed*12)*22;
    const r=Math.round(a.r+(b.r-a.r)*travel),g=Math.round(a.g+(b.g-a.g)*travel),blue=Math.round(a.b+(b.b-a.b)*travel);
    ctx.fillStyle='rgba('+r+','+g+','+blue+','+(a.a+(b.a-a.a)*travel)+')';
    const size=1.6+cloud*.35;ctx.fillRect(x-size/2,y-size/2,size,size);
   }
  }
  const active=p>.84;archiveSection.inert=!active;archiveSection.setAttribute('aria-hidden',!active);memberSection.setAttribute('aria-hidden',mf<.05);art.setAttribute('aria-hidden',dissolve>.95);
  archiveSection.style.pointerEvents=active?'auto':'none';
 }
 function update(){if(!queued){queued=true;requestAnimationFrame(render);}}
 addEventListener('scroll',update,{passive:true});addEventListener('resize',update);transitionStyle.addEventListener('load',update);
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
