// Temporary archive visuals; source and rights notes: assets/concept/README.md.
(() => {
  const section=document.querySelector('#concept');
  const pin=document.querySelector('.birth-pin');
  if(!section||!pin)return;
  const finalParagraph=section.querySelector('.story-copy p:last-child');
  const finalHold=document.createElement('div');finalHold.className='concept-final';
  finalParagraph.before(finalHold);finalHold.append(finalParagraph);
  const layer=document.createElement('div');layer.className='concept-liquid';layer.setAttribute('aria-hidden','true');
  const canvas=document.createElement('canvas');layer.append(canvas);pin.append(layer);
  const dust=document.createElement('canvas');dust.className='concept-exit-dust';pin.append(dust);
  const dg=dust.getContext('2d');let grains=null;
  function dissolve(amount){
    const w=pin.clientWidth,h=pin.clientHeight;
    if(dust.width!==w||dust.height!==h){dust.width=w;dust.height=h;grains=null;}
    dg.clearRect(0,0,w,h);
    if(amount<=0){grains=null;section.style.opacity='1';return;}
    if(!grains){
      const sample=document.createElement('canvas');sample.width=w;sample.height=h;
      const g=sample.getContext('2d',{willReadFrequently:true});g.drawImage(canvas,0,0,w,h);
      g.fillStyle='rgba(15,24,24,.32)';g.fillRect(0,0,w,h);
      section.querySelectorAll('.story-copy p').forEach(p=>{
        const style=getComputedStyle(p);g.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;g.fillStyle='#fffdf5';g.textBaseline='top';
        const walk=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);let node;
        while(node=walk.nextNode())for(let i=0;i<node.length;i++){
          const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1);
          const r=range.getBoundingClientRect();if(r.bottom>0&&r.top<h)g.fillText(node.textContent[i],r.left,r.top);
        }
      });
      const pixels=g.getImageData(0,0,w,h).data;grains=[];
      for(let y=0;y<h;y+=6)for(let x=0;x<w;x+=6){const k=(y*w+x)*4;
        grains.push({x,y,c:`rgb(${pixels[k]},${pixels[k+1]},${pixels[k+2]})`,s:Math.sin(x*12.7+y*3.1)});
      }
    }
    const spread=smooth(amount),fade=1-smooth((amount-.15)/.85);
    dg.globalAlpha=fade;
    for(const p of grains){dg.fillStyle=p.c;const size=6*(1-spread*.9);
      dg.fillRect(p.x+Math.sin(p.y*.009+p.s*3+spread*4)*spread*w*.25,p.y-spread*h*(.12+(p.s+1)*.22),size,size);}
    dg.globalAlpha=1;section.style.opacity=String(1-smooth(amount/.12));
  }
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let textures=[],images=[],ready=false,frame=0;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  const urls=[
    'assets/archive/imported/main-2022-visual.webp',
    'assets/archive/imported/main-2024-visual.webp',
    'assets/archive/imported/extra-2019-visual.jpg',
    'assets/archive/imported/main-2018-visual.jpg',
    'assets/archive/imported/main-2019-visual.png'
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
  function draw(){
    frame=0;if(!ready)return;
    const r=section.getBoundingClientRect(),h=pin.clientHeight;
    const show=smooth((h-r.top)/(h*.75));
    const exit=reduced.matches?0:clamp((h*1.1-r.bottom)/(h*.85));
    layer.style.opacity=show*(1-smooth(exit/.12));
    pin.style.backgroundColor=exit>0?'#fff':pin.style.backgroundColor;
    pin.querySelector('.hero-art').style.opacity=1;
    section.classList.add('liquid-ready');
    const paragraphs=[...section.querySelectorAll('.story-copy p')];
    const centers=paragraphs.map(p=>{const b=p.getBoundingClientRect();return b.top+b.height*.5;});
    let position=0;
    for(let i=0;i<centers.length-1;i++){
      if(centers[i]<h*.5)position=i+clamp((h*.5-centers[i])/(centers[i+1]-centers[i]));
    }
    position=Math.min(4,position);
    const index=Math.min(3,Math.floor(position));
    let blend=smooth(clamp((position-index-.20)/.6));
    if(reduced.matches)blend=blend>.5?1:0;
    if(!gl||!program){layer.style.backgroundImage='url('+urls[Math.round(position)]+')';return;}
    const dpr=Math.min(devicePixelRatio||1,1.5),w=Math.round(pin.clientWidth*dpr),height=Math.round(h*dpr);
    if(canvas.width!==w||canvas.height!==height){canvas.width=w;canvas.height=height;gl.viewport(0,0,w,height);}
    gl.useProgram(program);gl.uniform2f(loc.viewport,w,height);
    [index,index+1].forEach((n,unit)=>{gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,textures[n]);});
    gl.uniform1i(loc.firstImage,0);gl.uniform1i(loc.secondImage,1);
    gl.uniform2f(loc.firstSize,images[index].naturalWidth,images[index].naturalHeight);
    gl.uniform2f(loc.secondSize,images[index+1].naturalWidth,images[index+1].naturalHeight);
    gl.uniform1f(loc.progress,blend);gl.drawArrays(gl.TRIANGLES,0,6);
    dissolve(exit);
  }
  function update(){if(!frame)frame=requestAnimationFrame(draw);}
  Promise.all(urls.map(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;}))).then(result=>{
    images=result;try{setup();}catch(e){console.warn('Image transition fallback',e);canvas.hidden=true;program=null;}
    ready=true;update();
  }).catch(e=>console.warn('Reference backgrounds unavailable',e));
  addEventListener('scroll',update,{passive:true});addEventListener('resize',update);reduced.addEventListener('change',update);
})();
