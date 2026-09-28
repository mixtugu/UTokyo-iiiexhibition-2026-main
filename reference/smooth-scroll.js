// Ease the actual document scroll so sticky backgrounds and particle effects
// all follow the same position. Touch and keyboard keep native behavior.
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(any-pointer: fine)');
  const RESPONSE_MS = 170;
  let target = scrollY;
  let position = scrollY;
  let written = scrollY;
  let previousTime = 0;
  let frameId = 0;
  let sectionFrame=0,sectionMoving=false,sectionCooldown=0;
  let sectionIntent=0,sectionIntentAt=0;
  function stopSection(){cancelAnimationFrame(sectionFrame);sectionMoving=false;sectionIntent=0;sectionCooldown=performance.now()+1000;}
  function snapSection(element){
    cancel();sectionMoving=true;
    const from=scrollY,to=Math.min(limit(),element.getBoundingClientRect().top+scrollY),start=performance.now();
    function step(now){const p=Math.min(1,(now-start)/850),t=1-Math.pow(1-p,3);scrollTo({top:from+(to-from)*t,behavior:'instant'});if(p<1)sectionFrame=requestAnimationFrame(step);else stopSection();}
    sectionFrame=requestAnimationFrame(step);
  }
  function nextSection(){
    const works=document.querySelector('#works'),announce=document.querySelector('#announce'),access=document.querySelector('#access');
    if(!works||!announce||!access)return null;
    const w=works.getBoundingClientRect(),a=announce.getBoundingClientRect();
    if(w.top<100&&w.top>-innerHeight*.4&&!works.querySelector('.is-list-mode'))return announce;
    // Keep both announcement chapters readable instead of skipping the fund.
    if(a.top<=40&&a.bottom>40){
      const fund=announce.querySelector('.announce-fund');
      if(fund&&fund.getBoundingClientRect().top>100)return fund;
      if(a.bottom<=innerHeight+140)return access;
    }
    return null;
  }
  const limit = () => Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const bound = value => Math.max(0, Math.min(limit(), value));

  function cancel() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    target = position = written = scrollY;
  }

  function frame(time) {
    if (reducedMotion.matches || document.querySelector('dialog[open]')) {
      cancel();
      return;
    }
    const elapsed = Math.min(64, Math.max(1, time - previousTime));
    previousTime = time;
    target = bound(target);
    position += (target - position) * (1 - Math.exp(-elapsed / RESPONSE_MS));
    const done = Math.abs(target - position) < 0.4;
    if (done) position = target;
    window.scrollTo({top: position, left: scrollX, behavior: 'instant'});
    written = scrollY;
    if (done) {
      frameId = 0;
      target = position = written;
    } else {
      frameId = requestAnimationFrame(frame);
    }
  }

  function nativeArea(event) {
    for (const node of event.composedPath()) {
      if (!(node instanceof Element)) continue;
      if (node === document.body || node === document.documentElement) break;
      if (node.matches('dialog, input, textarea, select, [contenteditable], [data-native-scroll]')) return true;
      const overflow = getComputedStyle(node).overflowY;
      if (/(auto|scroll|overlay)/.test(overflow) && node.scrollHeight > node.clientHeight + 1) return true;
    }
    return false;
  }

  addEventListener('wheel', event => {
    if(sectionMoving){if(event.deltaY<0)stopSection();else{if(event.cancelable)event.preventDefault();return;}}
    if(event.deltaY>0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&Math.abs(event.deltaY)>Math.abs(event.deltaX)&&!reducedMotion.matches&&!document.querySelector('dialog[open]')&&!nativeArea(event)&&!window.conceptAutoScroll&&!window.heroAutoScroll&&!window.memberAutoScroll&&!window.memberEntryScroll&&performance.now()>sectionCooldown){const next=nextSection();if(next&&next.getBoundingClientRect().height){const now=performance.now();if(now-sectionIntentAt>500)sectionIntent=0;sectionIntentAt=now;sectionIntent+=Math.min(100,event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1));if(sectionIntent>=220){sectionIntent=0;if(event.cancelable)event.preventDefault();snapSection(next);return;}}else sectionIntent=0;}else sectionIntent=0;
    if(window.conceptAutoScroll||window.heroAutoScroll||window.memberAutoScroll||window.memberEntryScroll){cancel();if(event.deltaY>0&&event.cancelable)event.preventDefault();return;}
    if (event.defaultPrevented || !event.cancelable || reducedMotion.matches || !finePointer.matches ||
        event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
        !event.deltaY || document.querySelector('dialog[open]') || nativeArea(event)) {
      cancel();
      return;
    }
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    const delta = event.deltaY * unit;
    if (!frameId) position = target = written = scrollY;
    // Reversing direction responds immediately, without paying off old momentum.
    if ((target - position) * delta < 0) target = position;
    target = bound(Math.max(position - innerHeight * 1.5,
      Math.min(position + innerHeight * 1.5, target + delta)));
    event.preventDefault();
    if (!frameId && Math.abs(target - position) > 0.4) {
      previousTime = performance.now();
      frameId = requestAnimationFrame(frame);
    }
  }, {passive: false});

  // Yield immediately to links, focus, scrollbar dragging, and native gestures.
  addEventListener('pointerdown', cancel, {passive: true});
  ['pointerdown','touchstart','keydown','hashchange','resize'].forEach(type=>addEventListener(type,stopSection));
  addEventListener('touchstart', cancel, {passive: true});
  addEventListener('keydown', cancel);
  addEventListener('click', cancel, {capture: true});
  addEventListener('focusin', cancel);
  addEventListener('hashchange', cancel);
  addEventListener('popstate', cancel);
  addEventListener('resize', cancel);
  addEventListener('scroll', () => {
    if (!frameId || Math.abs(scrollY - written) > 2) cancel();
  }, {passive: true});
  document.addEventListener('visibilitychange', cancel);
  addEventListener('concept-auto-scroll',cancel);
  addEventListener('hero-auto-scroll',cancel);
  addEventListener('member-auto-scroll',cancel);
  reducedMotion.addEventListener('change', cancel);
  finePointer.addEventListener('change', cancel);
})();
