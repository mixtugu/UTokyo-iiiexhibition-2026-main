const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const works = [{title:'Memory Landscapes',image:'assets/works/memory-landscapes.png',description:'記憶をテーマにしたVRの中で、思い出の中をたゆたう。懐かしさを手がかりに、過去の記憶と新しい体験が重なる作品。'},{title:'Mollusk',image:'assets/works/mollusk.png',description:'見慣れたパッケージの中に置かれた、不思議なかたち。画像から作品を選び、詳細を開く体験のサンプルです。'}];
const dialog = document.querySelector('#detail');let selected=0,lastFocus;
function openWork(index){selected=index;const work=works[index];document.querySelector('#detail-image').src=work.image;document.querySelector('#detail-image').alt=work.title;document.querySelector('#detail-title').textContent=work.title;document.querySelector('#detail-number').textContent=`WORK / ${String(index+1).padStart(2,"0")}`;document.querySelector('#detail-description').textContent=work.description;dialog.querySelector(".draft-note").textContent=work.placeholder?"未提供作品の仮枠です。正式な作品ではありません。":"画像・作品情報は試作用です。会場分類は仮です。";if(!dialog.open){lastFocus=document.activeElement;dialog.showModal();}}
document.querySelector('.close-detail').onclick=()=>dialog.close();document.querySelector('#next-work').onclick=()=>openWork(1-selected);dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>lastFocus?.focus());
const archiveData=[['2024','なにいう展','assets/archive/extra-2024.png','https://iii-exhibition-2024-web.vercel.app/',27,25],['2023','voidage','assets/archive/extra-2023.jpg','https://iii-exhibition2023.vercel.app/',60,35],['2023','學藝運動','assets/archive/main-2023.png','https://iii-exhibition2023-main.vercel.app/',48,77]];
const stage=document.querySelector('.archive-stage');const contourGroup=document.querySelector('.contours');const outline=document.createElementNS('http://www.w3.org/2000/svg','use');outline.setAttribute('href','#contour');contourGroup.append(outline);
function clearArchive(){stage.classList.remove('previewing');stage.querySelectorAll('a').forEach(a=>a.classList.remove('active'));}
function populateArchives(items){
 const links=document.querySelector('.archive-links');links.replaceChildren();links.classList.add('archive-catalog');
 for(const group of [...new Set(items.map(i=>i.group))]){
  const column=document.createElement('div');column.className='archive-column';
  const heading=document.createElement('h3');heading.textContent=group;column.append(heading);
  for(const item of items.filter(i=>i.group===group)){
   const a=document.createElement('a');a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';a.title=item.year+' '+item.title;
   const year=document.createElement('small');year.textContent=item.year;
   const title=document.createElement('span');title.textContent=item.title+' ↗';a.append(year,title);
   const activate=()=>{
    stage.querySelectorAll('a').forEach(link=>link.classList.toggle('active',link===a));
    stage.classList.toggle('previewing',!!item.image);
    const image=document.querySelector('#archive-image');
    if(item.image)image.setAttribute('href',item.image);else image.removeAttribute('href');
   };
   a.addEventListener('pointerenter',activate);a.addEventListener('focus',activate);a.addEventListener('blur',clearArchive);column.append(a);
  }
  links.append(column);
 }
}
populateArchives(archiveData.map(([year,title,image,url])=>({year,title,image,url,group:'ARCHIVES'})));
fetch('assets/archive/imported/catalog.json').then(r=>{if(!r.ok)throw Error('Archive catalog unavailable');return r.json();}).then(populateArchives).catch(console.warn);
stage.addEventListener('pointerleave',clearArchive);
