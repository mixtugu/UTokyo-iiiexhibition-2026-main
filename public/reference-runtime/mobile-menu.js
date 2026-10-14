// Page navigation from a floating hamburger: a full-screen panel on phones, a right drawer on wider screens.
// The hamburger stays on screen on phones and appears on wider screens once the header nav has scrolled away.
(() => {
 const header=document.querySelector('.top-header'),toggle=header&&header.querySelector('.top-menu-toggle'),nav=header&&header.querySelector('#top-nav');
 if(!toggle||!nav)return;
 let threshold=0;
 const isOpen=()=>header.classList.contains('is-menu-open');
 const measure=()=>{if(!isOpen())threshold=Math.max(8,nav.getBoundingClientRect().bottom+scrollY,header.offsetHeight);};
 // Switch the transparent hamburger to white over dark sections and the coloured hero/concept visuals.
 const isDark=element=>{
  if(element&&element.closest('.birth-pin'))return true;
  for(let node=element;node&&node!==document.documentElement;node=node.parentElement){
   const match=getComputedStyle(node).backgroundColor.match(/[\d.]+/g);
   if(match&&(match[3]===undefined||+match[3]>.5))return .2126*match[0]+.7152*match[1]+.0722*match[2]<110;
  }
  return false;
 };
 const update=()=>{
  if(isOpen())return;
  header.classList.toggle('is-scrolled',scrollY>threshold);
  const rect=toggle.getBoundingClientRect(),below=document.elementsFromPoint(rect.left+rect.width/2,rect.top+rect.height/2).find(element=>!header.contains(element));
  header.classList.toggle('is-on-dark',isDark(below));
 };
 const setOpen=open=>{
  header.classList.toggle('is-menu-open',open);
  toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');
  if(!open){measure();update();}
 };
 toggle.addEventListener('click',()=>setOpen(!isOpen()));
 nav.addEventListener('click',event=>{if(event.target.closest('a'))setOpen(false);});
 header.addEventListener('click',event=>{if(event.target===header&&isOpen())setOpen(false);});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&isOpen()){setOpen(false);toggle.focus();}});
 matchMedia('(min-width: 701px)').addEventListener('change',()=>{setOpen(false);});
 addEventListener('scroll',update,{passive:true});
 addEventListener('resize',()=>{measure();update();});
 addEventListener('load',()=>{measure();update();});
 measure();update();
})();
