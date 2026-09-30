// The same image fragments carry the logo's ink into the concept vortex.
(() => {
 const hero=document.querySelector('#top'),art=hero.querySelector('.hero-art'),image=art.querySelector('.hero-brush');
 const concept=document.querySelector('#concept'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const journey=document.createElement('div');journey.className='birth-journey';
 const pin=document.createElement('div');pin.className='birth-pin';pin.setAttribute('aria-hidden','true');
 const content=document.createElement('div');content.className='birth-content';
 const intro=document.createElement('div');intro.className='birth-intro';
 hero.before(journey);journey.append(pin,content);content.append(intro,concept);intro.append(hero);pin.append(art);
 const canvas=document.createElement('canvas');canvas.className='hero-particles';canvas.setAttribute('aria-hidden','true');canvas.style.opacity='1';
 const ctx=canvas.getContext('2d'),source=document.createElement('canvas');source.width=source.height=560;
 const sg=source.getContext('2d',{willReadFrequently:true});
 const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
 let tiles=[],ready=false,visible=true,raf=0,width=0,height=0,box={},progress=0,lastPaint=0;
 const random=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
 function layout(){
  const a=art.getBoundingClientRect(),b=image.getBoundingClientRect();width=a.width;height=a.height;
  const fit=Math.min(b.width/image.naturalWidth,b.height/image.naturalHeight);
  box={w:image.naturalWidth*fit,h:image.naturalHeight*fit};box.x=b.left-a.left+(b.width-box.w)/2;box.y=b.top-a.top+(b.height-box.h)/2;
  const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  update();
 }
 function draw(now){
  raf=0;if(!ready)return;
  // The ink is decorative; drawing every second display frame is enough.
  if(!reduced.matches&&now-lastPaint<30){if(visible&&!document.hidden)raf=requestAnimationFrame(draw);return;}
  lastPaint=now;
  const j=journey.getBoundingClientRect(),cr=concept.getBoundingClientRect();
  progress=reduced.matches?0:clamp(-j.top/(height*.72));
  const leave=ease(progress/.72),merge=ease((height-cr.top)/(height*.8)),end=ease((height*.95-cr.bottom)/(height*.8));
  hero.style.opacity=String(1-ease((progress-.18)/.65));hero.inert=progress>.8;
  ctx.clearRect(0,0,width,height);
  if(progress<.005){
   if(reduced.matches)ctx.drawImage(image,box.x,box.y,box.w,box.h);
   else{
    // Subtle refraction in the ink only; typography remains perfectly still.
    const time=now*.0007,strip=3;
    for(let y=0;y<source.height;y+=strip){
     const h=Math.min(strip,source.height-y),wave=(Math.sin(y*.025+time)*6+Math.sin(y*.047-time*.7)*2.5)*Math.min(1.4,width/1280);
     const density=Math.min(devicePixelRatio||1,1.5),top=Math.round((box.y+y/560*box.h)*density)/density,bottom=Math.round((box.y+(y+h)/560*box.h)*density)/density;
     ctx.drawImage(image,0,y/560*image.naturalHeight,image.naturalWidth,h/560*image.naturalHeight,box.x+wave,top,box.w,bottom-top);
    }
    // A sparse patch of real ink fragments lifts from the silhouette and returns.
    for(let n=0;n<tiles.length;n+=23){
     const p=tiles[n],cycle=(now*.00013+p.seed)%1,lift=Math.sin(cycle*Math.PI)**2;
     const x=box.x+p.x/560*box.w,y=box.y+p.y/560*box.h;
     const dx=Math.sin(p.r*6.28)*lift*30,dy=-lift*(18+p.q*28);
     ctx.globalAlpha=.65*lift;ctx.fillStyle=p.color;
     const size=1.7+p.r*1.5;ctx.fillRect(x+dx,y+dy,size,size);
    }
   }
  }
  else{
   const time=now*.00025;
   // Complementary opacity, but unlike a crossfade every tile also changes position and size.
   const full=1-ease(progress/.10);
   if(full>0){ctx.globalAlpha=full;ctx.drawImage(image,box.x,box.y,box.w,box.h);}
   for(const p of tiles){
    const release=ease((progress-p.seed*.12)/.65),wave=Math.sin(release*Math.PI);
    const bx=box.x+p.x/560*box.w,by=box.y+p.y/560*box.h;
    const theta=time+(p.seed*3|0)*Math.PI*2/3+p.q*15;
    const sx=width*.5+Math.cos(theta)*width*(.045+p.q*.24),sy=height*(.88-p.q*.78)+Math.sin(theta)*height*.055;
    // A continuous, irregular arc directly to the vortex: no rectangular holding field.
    const travel=ease(release*.8+merge*.2),curl=Math.sin(Math.PI*travel);
    let x=bx+(sx-bx)*travel+Math.sin(p.seed*6.28+travel*2)*curl*width*(.035+p.r*.12);
    let y=by+(sy-by)*travel+Math.cos(p.r*6.28+travel*2)*curl*height*(.04+p.seed*.12);
    const particle=ease((release-.3)/.6),w=box.w*4/560*(1-particle)+1.7*particle,h=box.h*4/560*(1-particle)+1.7*particle;
    ctx.globalAlpha=(1-full)*(1-end);
    if(particle<.98)ctx.drawImage(source,p.x,p.y,4,4,x,y,w,h);
    else{ctx.fillStyle=p.color;ctx.fillRect(x,y,w,h);}
   }
  }
  ctx.globalAlpha=1;
  canvas.dataset.phase=merge>.9?'vortex':leave>0?'dissolving':'motif';
  if(visible&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(draw);
 }
 function update(){if(ready&&!raf)raf=requestAnimationFrame(draw);}
 image.decode().then(()=>{
  sg.drawImage(image,0,0,560,560);const pixels=sg.getImageData(0,0,560,560).data;
  for(let y=0;y<560;y+=4)for(let x=0;x<560;x+=4){const i=(y*560+x)*4;if(pixels[i+3]<16)continue;const n=tiles.length;tiles.push({x,y,seed:random(n),r:random(n+700),q:random(n+1700),color:`rgba(${pixels[i]},${pixels[i+1]},${pixels[i+2]},${pixels[i+3]/255})`});}
  ready=true;art.append(canvas);image.style.visibility='hidden';hero.classList.add('has-particle-logo');layout();
 }).catch(()=>{image.style.visibility='visible';});
 new ResizeObserver(()=>{if(ready)layout();}).observe(art);
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(!visible){cancelAnimationFrame(raf);raf=0;}else update();}).observe(journey);
 addEventListener('scroll',update,{passive:true});reduced.addEventListener('change',update);
 document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;if(!document.hidden)update();});
})();
