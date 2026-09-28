// Backgrounds exported from the Figma “最新版ページ” concept frames.
(() => {
  const section=document.querySelector('#concept');
  const pin=document.querySelector('.birth-pin');
  if(!section||!pin)return;
  const finalParagraph=section.querySelector('.story-copy p:last-child');
  const finalHold=document.createElement('div');finalHold.className='concept-final';
  finalParagraph.before(finalHold);finalHold.append(finalParagraph);
  const layer=document.createElement('div');layer.className='concept-liquid';layer.setAttribute('aria-hidden','true');
  const canvas=document.createElement('canvas');layer.append(canvas);pin.append(layer);
  layer.style.backgroundImage="url('assets/concept/figma-latest-1.png')";
  layer.style.backgroundSize='cover';layer.style.backgroundPosition='center';canvas.hidden=true;
  const dust=document.createElement('canvas');dust.className='concept-exit-dust';document.body.append(dust);
  dust.setAttribute('aria-hidden','true');
  Object.assign(dust.style,{position:'fixed',inset:'0',width:'100%',height:'100%',zIndex:'9',pointerEvents:'none'});
  const worksStage=document.querySelector('#works .wave-stage');
  const dg=dust.getContext('2d');let grains=null,grainSource=null,glyphs=[];
  function dissolve(amount){
    const w=pin.clientWidth,h=pin.clientHeight;
    if(w<1||h<1){grains=null;section.style.opacity='1';return;}
    if(dust.width!==w||dust.height!==h){dust.width=w;dust.height=h;grains=null;}
    dg.clearRect(0,0,w,h);
    const vortex=document.querySelector('.hero-particles');
    if(amount<=0){grains=null;section.style.opacity='1';if(vortex)vortex.style.visibility='';if(worksStage)worksStage.style.opacity='';return;}
    if(!grains){
      const sample=document.createElement('canvas');sample.width=w;sample.height=h;
      const g=sample.getContext('2d',{willReadFrequently:true});
      // The transition can start before WebGL has sized its source canvas.
      if(canvas.width>0&&canvas.height>0)g.drawImage(canvas,0,0,w,h);
      else{g.fillStyle='#fff';g.fillRect(0,0,w,h);}
      // Include the vortex in the same raster, then remove the independent layer.
      if(vortex&&vortex.width&&vortex.height)g.drawImage(vortex,0,0,w,h);
      g.fillStyle='rgba(15,24,24,.32)';g.fillRect(0,0,w,h);
      glyphs=[];
      section.querySelectorAll('.story-copy p').forEach(p=>{
        const style=getComputedStyle(p);g.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;g.fillStyle='#fffdf5';g.textBaseline='top';
        const walk=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);let node;
        while(node=walk.nextNode())for(let i=0;i<node.length;i++){
          const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1);
          const r=range.getBoundingClientRect();if(r.bottom>0&&r.top<h&&node.textContent[i].trim()){
            const stamp=document.createElement('canvas');stamp.width=Math.ceil(r.width+8);stamp.height=Math.ceil(r.height+8);
            const ink=stamp.getContext('2d');ink.font=g.font;ink.fillStyle='#fffdf5';ink.textBaseline='top';ink.fillText(node.textContent[i],4,4);
            const pixels=ink.getImageData(0,0,stamp.width,stamp.height).data,dots=[];
            for(let yy=0;yy<stamp.height;yy+=2)for(let xx=0;xx<stamp.width;xx+=2)if(pixels[(yy*stamp.width+xx)*4+3]>24)dots.push({x:xx,y:yy,j:Math.random()});
            glyphs.push({stamp,dots,x:r.left-4,y:r.top-4,fromY:scrollY,delay:.04+Math.random()*.24,dx:(Math.random()-.5)*90,dy:-20-Math.random()*45});
          }
        }
      });
      grainSource=sample;
      const pixels=g.getImageData(0,0,w,h).data;grains=[];
      const cards=[...document.querySelectorAll('#works .wave-card')].filter(el=>!el.hidden&&getComputedStyle(el).opacity!=='0').map(el=>el.getBoundingClientRect());
      const targetSample=document.createElement('canvas');targetSample.width=targetSample.height=32;const tg=targetSample.getContext('2d',{willReadFrequently:true});
      const photo=document.querySelector('#works .wave-card img');if(photo?.complete&&photo.naturalWidth)tg.drawImage(photo,0,0,32,32);
      const colors=tg.getImageData(0,0,32,32).data;
      for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8){const k=(y*w+x)*4;
        const s=Math.sin(x*12.7+y*3.1),q=(Math.sin(x*4.7+y*17.3)+1)/2,v=(s+1)/2,card=cards[grains.length%Math.max(1,cards.length)];
        const ci=(Math.min(31,Math.floor(v*32))*32+Math.min(31,Math.floor(q*32)))*4;
        // Neighboring fragments peel as small patches, with independent departure/arrival times.
        const patch=(Math.sin(Math.floor(x/64)*7.13+Math.floor(y/56)*13.71)+1)/2;
        const radius=Math.min(1,Math.hypot((x-w/2)/(w/2),(y-h/2)/(h/2)));
        const delay=.03+(1-radius)*.48+patch*.035;
        const arrival=.73+v*.18;
        grains.push({x,y,delay,duration:arrival-delay,fromY:scrollY,c:[pixels[k],pixels[k+1],pixels[k+2]],tc:[colors[ci],colors[ci+1],colors[ci+2]],tx:card?card.left+q*card.width:x,ty:card?card.top+scrollY+v*card.height:y+scrollY,s});
      }
    }
    if(vortex)vortex.style.visibility='hidden';
    const fade=1-smooth((amount-.94)/.06);
    dg.globalAlpha=fade;
    for(const p of grains){
      const spread=smooth((amount-p.delay)/p.duration);
      const x=p.x+(p.tx-p.x)*spread+Math.sin(Math.PI*spread)*p.s*w*.08,y=p.y+p.fromY+(p.ty-p.y-p.fromY)*spread-scrollY-Math.sin(Math.PI*spread)*h*.08;
      const size=8*(1-spread)+2*spread;
      // Preserve recognizable image texture while it breaks into moving fragments.
      if(spread<.55){dg.drawImage(grainSource,p.x,p.y,Math.min(8,w-p.x),Math.min(8,h-p.y),x,y,size,size);}
      else{const tint=smooth((spread-.55)/.45),color=p.c.map((c,i)=>Math.round(c+(p.tc[i]-c)*tint));dg.fillStyle=`rgb(${color.join(',')})`;dg.fillRect(x,y,size,size);}
    }
    // Text first floats as recognizable individual characters, then becomes fine ink grains.
    const targets=[...document.querySelectorAll('#works .wave-card')].filter(el=>!el.hidden);
    const targetRect=targets[0]?.getBoundingClientRect();
    for(const letter of glyphs){
      const age=clamp((amount-letter.delay)/(.92-letter.delay)),float=smooth(age/.42),peel=smooth((age-.20)/.35),travel=smooth((age-.30)/.70);
      const x=letter.x+letter.dx*float,y=letter.y+letter.fromY-scrollY+letter.dy*float;
      dg.globalAlpha=fade*(1-peel);dg.drawImage(letter.stamp,x,y);
      dg.globalAlpha=fade*peel;dg.fillStyle='#fffdf5';
      for(const dot of letter.dots){
        const tx=targetRect?targetRect.left+dot.j*targetRect.width:w*.5,ty=targetRect?targetRect.top+dot.j*targetRect.height:h*.6;
        dg.fillRect((x+dot.x)*(1-travel)+tx*travel+Math.sin(travel*Math.PI)*(dot.j-.5)*70,(y+dot.y)*(1-travel)+ty*travel,1.6,1.6);
      }
    }
    if(worksStage)worksStage.style.opacity=String(smooth((amount-.94)/.06));
    dg.globalAlpha=1;section.style.opacity=String(1-smooth(amount/.12));
  }
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let textures=[],images=[],ready=false,frame=0;
  let exitStart=0,exitFrom=0,exitTo=0,exitDone=false,lastScroll=scrollY,lastIntent=-Infinity,touchY=0;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  const urls=[
    'assets/concept/figma-latest-1.png',
    'assets/concept/figma-latest-2.png',
    'assets/concept/figma-latest-3.png',
    'assets/concept/figma-latest-4.png',
    'assets/concept/figma-latest-4.png'
  ];
  let program,loc;
  function shader(type,source){
    const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;
  }
  function setup(){
    if(!gl)return;
    const vs=shader(gl.VERTEX_SHADER,'attribute vec2 a;varying vec2 uv;void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}');
    const fs=shader(gl.FRAGMENT_SHADER,`
      precision mediump float;
      varying vec2 uv;
      uniform sampler2D firstImage,secondImage;
      uniform vec2 viewport,firstSize,secondSize;
      uniform float progress;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
      float field(vec2 p){return noise(p)*.6+noise(p*2.03)*.28+noise(p*4.11)*.12;}
      vec2 cover(vec2 p,vec2 size){float screen=viewport.x/viewport.y,ratio=size.x/size.y;
        return (p-.5)*vec2(min(screen/ratio,1.),min(ratio/screen,1.))+.5;}
      void main(){
        vec2 p=uv;float pulse=sin(progress*3.14159265);
        vec2 q=p*vec2(viewport.x/viewport.y,1.)*3.;
        float n=field(q+vec2(field(q+2.7),field(q+6.2)));
        vec2 warp=vec2(field(q+1.4)-.5,field(q+9.1)-.5)*pulse*.32;
        float boundary=mix(-.24,1.24,progress);
        float mask=1.-smoothstep(boundary-.15,boundary+.15,n);
        vec3 a=texture2D(firstImage,cover(p+warp,firstSize)).rgb;
        vec3 b=texture2D(secondImage,cover(p-warp,secondSize)).rgb;
        gl_FragColor=vec4(mix(a,b,mask),1.);
      }`);
    program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    loc=Object.fromEntries(['firstImage','secondImage','viewport','firstSize','secondSize','progress'].map(k=>[k,gl.getUniformLocation(program,k)]));
    textures=images.map(img=>{const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img);return tex;});
  }
  function draw(now){
    frame=0;
    const r=section.getBoundingClientRect(),h=pin.clientHeight;
    const down=scrollY>lastScroll;lastScroll=scrollY;
    if(r.bottom>h*1.4||(!down&&r.bottom>1&&!exitStart))exitDone=false;
    if(!reduced.matches&&!exitStart&&!exitDone&&down&&now-lastIntent<800&&r.bottom<h*1.08&&r.bottom>h*.6){
      exitStart=now;exitFrom=scrollY;exitTo=document.querySelector('#works').getBoundingClientRect().top+scrollY;
      window.conceptAutoScroll=true;dispatchEvent(new Event('concept-auto-scroll'));
    }
    if((r.top>h*1.85||r.bottom<0)&&!exitStart){layer.style.opacity=0;dissolve(0);return;}
    const show=smooth((h*1.85-r.top)/(h*1.1));
    // Fade the full image: a moving crop exposes a hard horizontal seam.
    layer.style.clipPath='none';
    layer.style.transform='none';
    if(!ready){layer.style.opacity=show;return;}
    // Outside an active transition, scrolling back always renders the real section.
    const exit=reduced.matches?0:exitStart?clamp((now-exitStart)/2800):0;
    if(exitStart){scrollTo({top:exitFrom+(exitTo-exitFrom)*smooth(Math.pow(exit,1.35)),behavior:'instant'});}
    layer.style.opacity=show*(1-smooth(exit/.12));
    pin.style.backgroundColor=exit>0?'#fff':pin.style.backgroundColor;
    section.classList.add('liquid-ready');
    const paragraphs=[...section.querySelectorAll('.story-copy p')];
    const centers=paragraphs.map(p=>{const b=p.getBoundingClientRect();return b.top+b.height*.5;});
    let position=0;
    for(let i=0;i<centers.length-1;i++){
      if(centers[i]<h*.35)position=i+clamp((h*.35-centers[i])/(centers[i+1]-centers[i]));
    }
    position=Math.min(4,position);
    const index=Math.min(3,Math.floor(position));
    let blend=smooth(clamp((position-index-.20)/.6));
    if(reduced.matches)blend=blend>.5?1:0;
    if(!gl||!program){
      layer.style.backgroundImage='url('+urls[Math.round(position)]+')';
      if(exitStart){if(exit<1)update();else{exitStart=0;exitDone=true;window.conceptAutoScroll=false;}}
      return;
    }
    const dpr=Math.min(devicePixelRatio||1,1.5),w=Math.round(pin.clientWidth*dpr),height=Math.round(h*dpr);
    if(canvas.width!==w||canvas.height!==height){canvas.width=w;canvas.height=height;gl.viewport(0,0,w,height);}
    gl.useProgram(program);gl.uniform2f(loc.viewport,w,height);
    [index,index+1].forEach((n,unit)=>{gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,textures[n]);});
    gl.uniform1i(loc.firstImage,0);gl.uniform1i(loc.secondImage,1);
    gl.uniform2f(loc.firstSize,images[index].naturalWidth,images[index].naturalHeight);
    gl.uniform2f(loc.secondSize,images[index+1].naturalWidth,images[index+1].naturalHeight);
    gl.uniform1f(loc.progress,blend);gl.drawArrays(gl.TRIANGLES,0,6);
    dissolve(exit);
    if(exitStart){
      if(exit<1)update();
      else{exitStart=0;exitDone=true;window.conceptAutoScroll=false;}
    }
  }
  function update(){if(!frame)frame=requestAnimationFrame(draw);}
  Promise.all(urls.map(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;}))).then(result=>{
  images=result;try{setup();canvas.hidden=!program;}catch(e){console.warn('Image transition fallback',e);canvas.hidden=true;program=null;}
    ready=true;update();
  }).catch(e=>console.warn('Reference backgrounds unavailable',e));
  addEventListener('scroll',update,{passive:true});addEventListener('resize',update);reduced.addEventListener('change',update);
  function interrupt(){lastIntent=-Infinity;exitStart=0;exitDone=false;window.conceptAutoScroll=false;dissolve(0);update();}
  addEventListener('wheel',e=>{if(e.deltaY<0)interrupt();else if(e.deltaY>0)lastIntent=performance.now();},{passive:true});
  addEventListener('touchstart',e=>{touchY=e.touches[0]?.clientY||0;},{passive:true});
  addEventListener('touchmove',e=>{const y=e.touches[0]?.clientY||0;if(y<touchY)lastIntent=performance.now();else interrupt();touchY=y;},{passive:true});
  addEventListener('pointerdown',()=>{lastIntent=-Infinity;interrupt();});
  addEventListener('hashchange',()=>{lastIntent=-Infinity;interrupt();});
  addEventListener('keydown',e=>{interrupt();if(['PageDown','ArrowDown',' '].includes(e.key))lastIntent=performance.now();});
})();
