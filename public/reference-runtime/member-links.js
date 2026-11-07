// Profile links for members (from the team's member data; empty links are left out).
// line: the name's guide route (index of .name-route), start/end distance along it, and the distance from
// the route to just below the letters at the start/end (artwork units; the names sit slightly off their routes).
(() => {
 const links=[
  {name:'キム ジェミン',url:'https://loveisanopendoor.github.io/'},
  {name:'ウォンカム 真生路',url:'http://michaelwongkam.com',line:[0,404,656,7,15]},
  {name:'猪原 大智',url:'https://inotai.net/about',line:[0,688,846,18,29]},
  {name:'イ ソジョン',url:'https://portfolio-mixtugu.onrender.com/',line:[3,344,502,15,15]},
  {name:'野原 春菜',url:'https://www.linkedin.com/in/haruna-nohara',line:[11,152,290,17,24]},
  {name:'田牧 悠吾',url:'https://instagram.com/myoeeen',line:[6,672,808,16,10]}
 ];
 const anchor=(link)=>{const a=document.createElement('a');a.href=link.url;a.target='_blank';a.rel='noopener noreferrer';return a;};
 const sameName=(a,b)=>a.replace(/[\s　]+/g,'')===b.replace(/[\s　]+/g,'');
 // Work credits ("A、B、C"): link each name that has a profile. Used by the works detail views.
 window.writeMemberNames=(target,credit)=>{
  target.replaceChildren(...credit.split('、').flatMap((name,i)=>{
   const link=links.find(item=>sameName(item.name,name)),node=link?anchor(link):document.createTextNode(name);
   if(link){node.className='member-profile-link';node.textContent=name;}
   return i?['、',node]:[node];
  }));
 };

 const section=document.querySelector('#members');
 if(!section)return;

 // Phones: the plain-text list.
 for(const dd of section.querySelectorAll('.member-list dd')){
  const link=links.find(item=>item.name===dd.textContent.trim());
  if(!link)continue;
  const a=anchor(link);a.className='member-profile-link';a.textContent=dd.textContent;dd.replaceChildren(a);
 }

 // Desktop: the names are drawn into the artwork, so curved link areas follow the same routes as the marker.
 const art=section.querySelector('.member-art'),canvas=art?.querySelector('#marker-canvas');
 const routes=[...section.querySelectorAll('.name-route')];
 if(!art||!canvas||!routes.length)return;
 // Same mapping as members-marker-prototype.js: 1675-unit-wide routes inside the 1200px artwork frame.
 const width=1675,height=width*3329/3682;
 const routeY=y=>(245+y*760/939)*width/1200;
 const ns='http://www.w3.org/2000/svg';
 const layer=document.createElementNS(ns,'svg');
 layer.setAttribute('class','member-link-layer');layer.setAttribute('viewBox',`0 0 ${width} ${height}`);
 for(const link of links.filter(link=>link.line)){
  const [index,from,to,below0,below1]=link.line,route=routes[index],length=route.getTotalLength();
  // Past the route's end, continue straight along its last direction.
  const at=s=>{const q=route.getPointAtLength(Math.min(length,Math.max(0,s))),over=s-length;
   if(over<=0)return {x:q.x,y:routeY(q.y)};
   const p=route.getPointAtLength(length-4),dx=q.x-p.x,dy=routeY(q.y)-routeY(p.y),d=Math.hypot(dx,dy)||1;
   return {x:q.x+dx/d*over,y:routeY(q.y)+dy/d*over};};
  const offset=(shift)=>{let d='';
   for(let s=from;s<=to+.1;s+=6){
    const a=at(s-3),b=at(s+3),c=at(s),l=Math.hypot(b.x-a.x,b.y-a.y)||1,t=(s-from)/(to-from);
    // Below the letters: to the right of the reading direction.
    const below=below0+(below1-below0)*t+shift;
    d+=`${d?'L':'M'}${(c.x-(b.y-a.y)/l*below).toFixed(1)} ${(c.y+(b.x-a.x)/l*below).toFixed(1)}`;
   }
   return d;};
  const a=document.createElementNS(ns,'a');
  a.setAttribute('href',link.url);a.setAttribute('target','_blank');a.setAttribute('rel','noopener noreferrer');
  a.setAttribute('aria-label',link.name);a.setAttribute('class','member-link-spot');
  // A thick stroke centred on the letters: the click area and, on hover, the silhouette.
  const hit=document.createElementNS(ns,'path');
  hit.setAttribute('class','member-link-hit');hit.setAttribute('d',offset(-14));
  a.append(hit);layer.append(a);
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
