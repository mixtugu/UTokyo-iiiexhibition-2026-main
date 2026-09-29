(()=>{
  const canvas=document.querySelector('#field');
  const ctx=canvas.getContext('2d',{alpha:false});
  const mask=document.createElement('canvas');
  const maskCtx=mask.getContext('2d',{willReadFrequently:true});
  const controls=document.querySelector('#controls');
  const ids=['spacing','size','base','contrast','font-size','gaps','motion-density','motion-speed'];
  const fields=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
  const palettes={
    green:{paper:'#eff5ed',dot:[76,128,91],ink:'#193627',accent:'#487a55'},
    blue:{paper:'#eef4f8',dot:[77,121,164],ink:'#1b354d',accent:'#4d79a6'},
    ink:{paper:'#f3f3f0',dot:[66,80,76],ink:'#273632',accent:'#536965'}
  };
  let mode='dark',palette='green',seed=1,frame=0,width=0,height=0,reveal=1,revealFrame=0;
  let maskPixels,maskDirty=true,phase=0,motionFrame=0,lastTick=0,lastMotionDraw=0,paused=false;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const number=id=>Number(fields[id].value);
  const hash=(x,y)=>{let n=(Math.imul(x+seed*17,374761393)+Math.imul(y+seed*31,668265263))|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296};

  function updateOutputs(){
    const unit={'spacing':' px','size':' px','base':'%','contrast':'%','font-size':' px','gaps':'%','motion-density':'%','motion-speed':'%'};
    for(const id of ids)document.getElementById(id+'-value').textContent=fields[id].value+unit[id];
  }

  function drawTextMask(){
    mask.width=width;mask.height=height;
    maskCtx.clearRect(0,0,width,height);
    const lines=(document.querySelector('#phrase').value.trim()||' ').split('\n').slice(0,3);
    const mobile=width<700;
    const centerX=mobile?width*.5:width*.64;
    const centerY=mobile?height*.34:height*.5;
    const size=number('font-size');
    maskCtx.fillStyle='#000';
    maskCtx.font='800 '+size+'px "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif';
    maskCtx.textAlign='center';maskCtx.textBaseline='middle';
    maskCtx.strokeStyle='#000';maskCtx.lineJoin='round';maskCtx.lineWidth=Math.max(3,size*.04);
    lines.forEach((line,i)=>{
      const maxWidth=mobile?width*.88:Math.max(240,width-centerX-40)*1.9;
      const lineY=centerY+(i-(lines.length-1)/2)*size*1.16;
      maskCtx.strokeText(line,centerX,lineY,maxWidth);
      maskCtx.fillText(line,centerX,lineY,maxWidth);
    });
    return maskCtx.getImageData(0,0,width,height).data;
  }

  function draw(){
    frame=0;
    const colors=palettes[palette];
    ctx.fillStyle=colors.paper;ctx.fillRect(0,0,width,height);
    if(maskDirty){maskPixels=drawTextMask();maskDirty=false}
    const pixels=maskPixels;
    const spacing=number('spacing'),radius=number('size');
    const base=number('base')/100,contrast=number('contrast')/100,gaps=number('gaps')/100;
    const density=number('motion-density')/100;
    const threshold=.73-.4*density;
    const driftX=phase*27,driftY=phase*17;
    const [r,g,b]=colors.dot;
    const sample=(sx,sy)=>pixels[(Math.min(height-1,Math.max(0,Math.floor(sy)))*width+Math.min(width-1,Math.max(0,Math.floor(sx))))*4+3]/255;
    for(let row=0,y=spacing/2;y<height;y+=spacing,row++){
      for(let col=0,x=spacing/2;x<width;x+=spacing,col++){
        const inside=Math.max(sample(x,y),sample(x-2,y),sample(x+2,y),sample(x,y-2),sample(x,y+2));
        if(hash(col,row)<gaps*(1-(inside>.4?.45*reveal:0)))continue;
        if(mode==='negative'&&inside>.4&&hash(col+99,row+101)<reveal)continue;
        let activity=0;
        if(density&&inside<.06&&sample(x-spacing/2,y)<.06&&sample(x+spacing/2,y)<.06
          &&sample(x,y-spacing/2)<.06&&sample(x,y+spacing/2)<.06){
          const tone=.72*smoothNoise(x+driftX,y+driftY,115)
            +.28*smoothNoise(x-driftY,y+driftX,48);
          const grain=(hash(col+173,row+281)-.5)*.12;
          activity=Math.min(1,Math.max(0,(tone+grain-threshold)*5));
          if(hash(col+487,row+339)<.06)activity=0;
        }
        const variation=.84+hash(col+61,row+97)*.3;
        const alpha=Math.min(1,(base+(mode==='dark'?inside*(contrast-base)*reveal:0)+activity*.045)*variation);
        const dotRadius=radius*(mode==='dark'?1+inside*.13*reveal:1);
        ctx.fillStyle='rgba('+r+','+g+','+b+','+alpha.toFixed(3)+')';
        const smallSide=Math.max(1,Math.round(dotRadius*2));
        const side=Math.min(spacing-2,smallSide+Math.round(activity*1.5));
        ctx.fillRect(Math.round(x-side/2),Math.round(y-side/2),side,side);
        if(activity>.18&&hash(col+491,row+37)<.08+density*.4){
          const horizontal=hash(col+59,row+367)>.5;
          const nx=x+(horizontal?spacing:0),ny=y+(horizontal?0:spacing);
          if(nx<width&&ny<height&&sample(nx,ny)<.06&&hash(col+(horizontal?1:0),row+(horizontal?0:1))>=gaps){
            const lineSize=Math.max(1,Math.round(side*.36));
            ctx.fillStyle='rgba('+r+','+g+','+b+','+Math.min(.32,alpha+.025).toFixed(3)+')';
            if(horizontal)ctx.fillRect(Math.round(x+side/2),Math.round(y-lineSize/2),Math.max(1,spacing-side),lineSize);
            else ctx.fillRect(Math.round(x-lineSize/2),Math.round(y+side/2),lineSize,Math.max(1,spacing-side));
          }
        }
      }
    }
  }

  function smoothNoise(x,y,scale){
    const gx=x/scale,gy=y/scale,ix=Math.floor(gx),iy=Math.floor(gy);
    const fx=gx-ix,fy=gy-iy;
    const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
    const top=hash(ix,iy)*(1-sx)+hash(ix+1,iy)*sx;
    const bottom=hash(ix,iy+1)*(1-sx)+hash(ix+1,iy+1)*sx;
    return top*(1-sy)+bottom*sy;
  }

  function motionTick(now){
    motionFrame=0;
    if(paused||reducedMotion.matches||document.hidden)return;
    if(lastTick)phase+=Math.min(.1,(now-lastTick)/1000)*(number('motion-speed')/100*1.72);
    lastTick=now;
    if(now-lastMotionDraw>50){draw();lastMotionDraw=now}
    motionFrame=requestAnimationFrame(motionTick);
  }

  function syncMotion(){
    cancelAnimationFrame(motionFrame);motionFrame=0;lastTick=0;
    if(!paused&&!reducedMotion.matches&&!document.hidden)motionFrame=requestAnimationFrame(motionTick);
    else schedule();
  }

  function schedule(){if(!frame)frame=requestAnimationFrame(draw)}
  function resize(){
    width=Math.max(1,Math.round(innerWidth));height=Math.max(1,Math.round(innerHeight));
    const ratio=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    maskDirty=true;
    schedule();
  }
  for(const id of ids)fields[id].addEventListener('input',()=>{if(id==='font-size')maskDirty=true;updateOutputs();schedule()});
  document.querySelector('#phrase').addEventListener('input',()=>{maskDirty=true;schedule()});
  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
    mode=button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(item=>{const active=item===button;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',active)});
    schedule();
  }));
  document.querySelectorAll('[data-palette]').forEach(button=>button.addEventListener('click',()=>{
    palette=button.dataset.palette;
    const colors=palettes[palette];
    document.documentElement.style.setProperty('--paper',colors.paper);
    document.documentElement.style.setProperty('--ink',colors.ink);
    document.documentElement.style.setProperty('--accent',colors.accent);
    document.querySelectorAll('[data-palette]').forEach(item=>{const active=item===button;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',active)});
    schedule();
  }));
  document.querySelector('#randomize').addEventListener('click',()=>{seed++;schedule()});
  document.querySelector('#motion-toggle').addEventListener('click',event=>{
    paused=!paused;
    event.currentTarget.textContent=paused?'再生 ▶':'一時停止 Ⅱ';
    event.currentTarget.setAttribute('aria-pressed',String(paused));
    syncMotion();
  });
  document.querySelector('#reveal-toggle').addEventListener('click',event=>{
    const button=event.currentTarget;
    const target=button.getAttribute('aria-pressed')==='true'?0:1;
    button.setAttribute('aria-pressed',String(target===1));
    button.textContent=target?'文字を消す ◌':'文字を出す ●';
    cancelAnimationFrame(revealFrame);
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){reveal=target;schedule();return}
    const startValue=reveal,startTime=performance.now(),duration=600;
    function step(now){
      const t=Math.min(1,(now-startTime)/duration),ease=t*t*(3-2*t);
      reveal=startValue+(target-startValue)*ease;
      draw();
      if(t<1)revealFrame=requestAnimationFrame(step);
    }
    revealFrame=requestAnimationFrame(step);
  });
  document.querySelector('#toggle-controls').addEventListener('click',event=>{
    const hidden=document.body.classList.toggle('controls-hidden');
    controls.inert=hidden;
    event.currentTarget.setAttribute('aria-expanded',String(!hidden));
    event.currentTarget.textContent=hidden?'設定を表示 ↙':'設定を隠す ↗';
  });
  document.querySelector('#save').addEventListener('click',()=>{
    const link=document.createElement('a');link.download='dot-type-lab.png';link.href=canvas.toDataURL('image/png');link.click();
    document.querySelector('#status').textContent='PNGを保存しました';
  });
  addEventListener('resize',resize);
  document.addEventListener('visibilitychange',syncMotion);
  reducedMotion.addEventListener('change',syncMotion);
  document.fonts.ready.then(()=>{maskDirty=true;schedule()});
  updateOutputs();resize();syncMotion();
})();
