(() => {
 const section=document.querySelector('#works');
 section.querySelector('.rings').remove();section.querySelector('.works-bottom').remove();section.querySelector('#work-list').remove();
 const ui=document.createElement('div');ui.className='wave-gallery spatial-gallery';
 section.append(ui);
 const upcoming=document.createElement('p');upcoming.className='works-upcoming';upcoming.textContent='作品は順次追加予定です。';section.append(upcoming);

 // Desktop catalog: four columns, with invited works spanning two columns.
 const desktopRoot=document.createElement('div');
 desktopRoot.className='works-desktop';
 desktopRoot.innerHTML=`<div class="works-desktop-panel"><div class="wave-filters works-desktop-filters" role="group" aria-label="作品の絞り込み"><button type="button" data-desktop-venue="all" aria-pressed="true">ALL</button><button type="button" data-desktop-venue="0" aria-pressed="false">工学部2号館</button><button type="button" data-desktop-venue="1" aria-pressed="false">情報学環本館</button><button type="button" data-desktop-venue="invite" aria-pressed="false">招待作品</button></div><div class="works-desktop-grid"></div><nav class="works-desktop-pagination" aria-label="作品一覧のページ"></nav></div>`;
 ui.append(desktopRoot);
 const desktopGrid=desktopRoot.querySelector('.works-desktop-grid');
 const desktopPagination=desktopRoot.querySelector('.works-desktop-pagination');
 const desktopPageSize=11;
 let desktopVenue='all',desktopPage=0;
 // A work may be shown in both buildings ("0,1"); invited works also keep their building.
 const venuesOf=w=>String(w.venue).split(',');
 const matchesVenue=(w,venue)=>venue==='all'||(venue==='invite'?w.invited:venuesOf(w).includes(venue));
 const venueNames=w=>venuesOf(w).map(v=>v==='1'?'情報学環本館':'工学部2号館');
 function venueTags(work,className,solid){
  return [...venueNames(work),...(work.invited?['招待作品']:[])].map((name,i)=>{
   const tag=document.createElement('span');tag.className=className+(solid&&i<venuesOf(work).length?' is-solid':'');tag.textContent=name;return tag;
  });
 }
 function desktopTags(work){
  const row=document.createElement('span');row.className='works-desktop-tags';
  row.append(...venueTags(work,'works-desktop-tag',true));return row;
 }
 function desktopCard(work,index){
  const available=!work.placeholder;
  const card=document.createElement(available?'button':'article');
  card.className='works-desktop-card'+(work.invited?' is-invited':'')+(available?'':' is-placeholder');
  if(available){
   card.type='button';
   card.setAttribute('aria-label',`${work.title}の詳細を見る`);
   card.onclick=()=>openWork(index);
   card.append(desktopTags(work));
  }
  const media=document.createElement('span');media.className='works-desktop-media';
  const image=document.createElement('img');
  image.src=available?work.image:'assets/concept/iiiex2026-logo.webp';
  image.alt='';image.loading='lazy';media.append(image);
  const title=document.createElement('span');title.className='works-desktop-title';
  title.textContent=available?work.title:'coming soon';
  const author=document.createElement('span');author.className='works-desktop-author';
  author.setAttribute('aria-hidden','true');
  card.append(media,title,author);
  return card;
 }
 function renderDesktop(){

  const items=works.map((work,index)=>({work,index})).filter(({work})=>matchesVenue(work,desktopVenue));
  const pageCount=Math.max(1,Math.ceil(items.length/desktopPageSize));
  desktopPage=Math.min(desktopPage,pageCount-1);
  const visible=items.slice(desktopPage*desktopPageSize,(desktopPage+1)*desktopPageSize);
  desktopGrid.replaceChildren(...visible.map(({work,index})=>desktopCard(work,index)));
  desktopPagination.replaceChildren();
  for(let page=0;page<pageCount;page++){
   const button=document.createElement('button');button.type='button';button.textContent=String(page+1);
   button.setAttribute('aria-label',`${page+1}ページ目`);
   if(page===desktopPage)button.setAttribute('aria-current','page');
   button.onclick=()=>{desktopPage=page;renderDesktop();desktopRoot.scrollIntoView({block:'start'});};
   desktopPagination.append(button);
  }
 }
 desktopRoot.querySelectorAll('[data-desktop-venue]').forEach(button=>button.onclick=()=>{
  desktopVenue=button.dataset.desktopVenue;desktopPage=0;
  desktopRoot.querySelectorAll('[data-desktop-venue]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  renderDesktop();
 });
 renderDesktop();

 // Mobile catalog: invited works use full-width features; regular works use a two-column grid.
 const mobileRoot=document.createElement('div');
 mobileRoot.className='works-mobile';
 mobileRoot.innerHTML=`<div class="wave-filters works-mobile-filters" role="group" aria-label="作品の絞り込み"><button type="button" data-mobile-venue="all" aria-pressed="true">ALL</button><button type="button" data-mobile-venue="0" aria-pressed="false">工学部2号館</button><button type="button" data-mobile-venue="1" aria-pressed="false">情報学環本館</button><button type="button" data-mobile-venue="invite" aria-pressed="false">招待作品</button></div><div class="works-mobile-list"></div><article class="works-mobile-detail" hidden><img class="works-mobile-detail-image" alt=""><div class="works-mobile-detail-tags"></div><h3></h3><p class="works-mobile-detail-meta">名前が入ります。 所属情報が入ります。</p><p class="works-mobile-detail-body"></p><button type="button" class="works-mobile-back">一覧に戻る</button></article>`;
 ui.append(mobileRoot);
 const mobileList=mobileRoot.querySelector('.works-mobile-list');
 const mobileDetail=mobileRoot.querySelector('.works-mobile-detail');

 let mobileVenue='all',mobileTrigger=null,listScroll=0;
 const mobileTitle=w=>w.title;
 const mobileImage=w=>w.image;
 function tagRow(work,solid){
  const row=document.createElement('span');row.className='works-mobile-tags';
  row.append(...venueTags(work,'works-mobile-tag',solid));return row;
 }
 function renderMobileList(){
  mobileList.replaceChildren();

  const items=works.map((w,i)=>({w,i})).filter(({w})=>matchesVenue(w,mobileVenue));
  const featuredItems=items.filter(({w})=>w.invited);
  const gridItems=items.filter(({w})=>!w.invited);
  featuredItems.forEach(featured=>{
   const button=document.createElement('button');button.type='button';button.className='works-mobile-feature';
   button.setAttribute('aria-label',mobileTitle(featured.w)+'の詳細を開く');
   const frame=document.createElement('span');frame.className='works-mobile-frame';
   const image=document.createElement('img');image.src=mobileImage(featured.w);image.alt='';
   frame.append(tagRow(featured.w,true),image);
   const title=document.createElement('span');title.className='works-mobile-feature-title';title.textContent=mobileTitle(featured.w);
   button.append(frame,title);
   button.onclick=()=>openMobileDetail(featured.i,button);
   mobileList.append(button);
  });
  const grid=document.createElement('div');grid.className='works-mobile-grid';
  if(!featuredItems.length)grid.classList.add('is-filtered');
  gridItems.forEach(({w,i})=>{
   const button=document.createElement('button');button.type='button';button.className='works-mobile-card';
   button.setAttribute('aria-label',mobileTitle(w)+'の詳細を開く');
   const image=document.createElement('img');image.src=mobileImage(w);image.alt='';image.loading='lazy';
   const title=document.createElement('span');title.className='works-mobile-card-title';title.textContent=mobileTitle(w);
   button.append(tagRow(w,true),image,title);
   button.onclick=()=>openMobileDetail(i,button);
   grid.append(button);
  });
  if(gridItems.length)mobileList.append(grid);
  if(!items.length){
   const empty=document.createElement('p');empty.className='works-mobile-empty';empty.textContent='該当する作品はありません。';
   mobileList.append(empty);
  }
 }
 function openMobileDetail(index,trigger){
  const work=works[index];if(!work)return;
  listScroll=scrollY;mobileTrigger=trigger;
  const image=mobileRoot.querySelector('.works-mobile-detail-image');
  image.src=mobileImage(work);image.alt=mobileTitle(work);
  const tags=mobileRoot.querySelector('.works-mobile-detail-tags');
  tags.replaceChildren(tagRow(work,true));
  mobileRoot.querySelector('.works-mobile-detail h3').textContent=mobileTitle(work);
  mobileRoot.querySelector('.works-mobile-detail-body').textContent=work.description;
  const meta=mobileRoot.querySelector('.works-mobile-detail-meta');
  if(window.writeMemberNames)window.writeMemberNames(meta,work.author);else meta.textContent=work.author;
  mobileList.hidden=true;mobileDetail.hidden=false;
  section.scrollIntoView({block:'start'});
  mobileRoot.querySelector('.works-mobile-back').focus();
 }
 function closeMobileDetail(){
  mobileDetail.hidden=true;mobileList.hidden=false;
  scrollTo({top:listScroll});
  mobileTrigger?.focus();
 }
 mobileRoot.querySelector('.works-mobile-back').onclick=closeMobileDetail;
 mobileRoot.querySelectorAll('[data-mobile-venue]').forEach(b=>b.onclick=()=>{
  mobileVenue=b.dataset.mobileVenue;
  mobileRoot.querySelectorAll('[data-mobile-venue]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  mobileDetail.hidden=true;mobileList.hidden=false;
  renderMobileList();
  section.scrollIntoView({block:'start'});
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mobileDetail.hidden){e.preventDefault();closeMobileDetail();}});
 renderMobileList();
})();
