// Profile links for members (from the team's member data; empty links are left out).
// spot: centre x/y, width, height in % of the 3682x3329 members artwork, and the text angle in degrees.
(() => {
 const links=[
  {name:'ウォンカム 真生路',url:'https://linktr.ee/mikey_130',spot:[29.15,30.31,16,3.43,5]},
  {name:'猪原 大智',url:'https://inotai.net/about',spot:[41.75,35.23,9.5,3.43,39]},
  {name:'イ ソジョン',url:'https://portfolio-mixtugu.onrender.com/',spot:[35.75,93.46,9.25,3.43,-38]},
  {name:'野原 春菜',url:'https://www.linkedin.com/in/haruna-nohara',spot:[63.1,55.69,9.5,3.43,-50]},
  {name:'田牧 悠吾',url:'https://instagram.com/myoeeen',spot:[31.75,60.39,9.5,3.43,-44]}
 ];
 const section=document.querySelector('#members');
 if(!section)return;
 const anchor=(link)=>{const a=document.createElement('a');a.href=link.url;a.target='_blank';a.rel='noopener noreferrer';return a;};

 // Phones: the plain-text list.
 for(const dd of section.querySelectorAll('.member-list dd')){
  const link=links.find(item=>item.name===dd.textContent.trim());
  if(!link)continue;
  const a=anchor(link);a.className='member-profile-link';a.textContent=dd.textContent;dd.replaceChildren(a);
 }

 // Desktop: the names are drawn into the artwork, so clickable areas sit over them.
 const art=section.querySelector('.member-art'),canvas=art?.querySelector('#marker-canvas');
 if(!art||!canvas)return;
 const layer=document.createElement('div');layer.className='member-link-layer';
 for(const link of links){
  const [x,y,w,h,angle]=link.spot,a=anchor(link);
  a.className='member-link-spot';a.setAttribute('aria-label',link.name);
  Object.assign(a.style,{left:`${x}%`,top:`${y}%`,width:`${w}%`,height:`${h}%`,transform:`translate(-50%,-50%) rotate(${angle}deg)`});
  layer.append(a);
 }
 if(getComputedStyle(art).position==='static')art.style.position='relative';
 art.append(layer);
 // Match the drawing inside the canvas box (object-fit: contain).
 const ratio=3682/3329;
 function sync(){
  const cw=canvas.clientWidth,ch=canvas.clientHeight;
  let w=cw,h=cw/ratio;if(h>ch){h=ch;w=ch*ratio;}
  Object.assign(layer.style,{left:`${canvas.offsetLeft+(cw-w)/2}px`,top:`${canvas.offsetTop+(ch-h)/2}px`,width:`${w}px`,height:`${h}px`});
 }
 new ResizeObserver(sync).observe(canvas);sync();
})();
