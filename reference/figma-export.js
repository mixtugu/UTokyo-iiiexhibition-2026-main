// A static, all-sections-visible view for Figma capture only.
if(new URLSearchParams(location.search).has('figma-export')){
 addEventListener('load',()=>{
  const style=document.createElement('style');
  style.textContent=`
   *,*::before,*::after{animation:none!important;transition:none!important}
   .chapter-stack>#announce.announce,.chapter-stack>#access{position:relative!important;top:auto!important;height:auto!important}
   .announce-pin{position:static!important;min-height:0!important}
   .announce-panels{display:block!important}
   .announce-chapter,.announce-reveal{opacity:1!important;transform:none!important}
   .announce-chapter{padding-block:64px!important}
   .member-journey,.journey-pin{height:auto!important;position:relative!important;overflow:visible!important}
   .journey-pin>section{position:relative!important;inset:auto!important;height:760px!important;opacity:1!important}
   .journey-pin .particle-field{display:none!important}
   .journey-pin .particle-original{top:100px!important;transform:translateX(-50%)!important;opacity:1!important}
  `;
  document.head.append(style);
  document.querySelectorAll('img[loading="lazy"]').forEach(img=>img.loading='eager');
  document.querySelectorAll('[inert]').forEach(node=>node.inert=false);
  document.querySelectorAll('.announce-chapter,.journey-pin>section').forEach(node=>node.removeAttribute('aria-hidden'));
 });
}
