// One moving highlight per group; buttons retain their native focus/ARIA state.
(() => {
 for(const group of document.querySelectorAll('.wave-filters,.archive-tabs')){
  group.querySelectorAll('button').forEach(button=>button.addEventListener('pointerdown',event=>{if(event.button===0){group.dataset.pointerFocus='true';event.preventDefault();button.focus({preventScroll:true});}}));
  group.addEventListener('keydown',()=>{delete group.dataset.pointerFocus;});
  const indicator=document.createElement('span');indicator.className='selection-highlight';indicator.setAttribute('aria-hidden','true');group.prepend(indicator);group.classList.add('sliding-selection');
  function place(){
   const selected=group.querySelector('button[aria-pressed="true"]');if(!selected)return;
   indicator.style.width=selected.offsetWidth+'px';indicator.style.height=selected.offsetHeight+'px';
   indicator.style.transform=`translate(${selected.offsetLeft}px,${selected.offsetTop}px)`;
  }
  new MutationObserver(place).observe(group,{subtree:true,attributes:true,attributeFilter:['aria-pressed']});
  new ResizeObserver(place).observe(group);place();
 }
})();
