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
  function snapSection(element,duration=850){
    cancel();sectionMoving=true;snapLock=sectionOf(element);
    const from=scrollY,to=Math.min(limit(),element.getBoundingClientRect().top+scrollY),start=performance.now();
    function step(now){const p=Math.min(1,(now-start)/duration),t=1-Math.pow(1-p,3);scrollTo({top:from+(to-from)*t,behavior:'instant'});if(p<1)sectionFrame=requestAnimationFrame(step);else stopSection();}
    sectionFrame=requestAnimationFrame(step);
  }
  function nextSection(){
    const works=document.querySelector('#works'),announce=document.querySelector('#announce'),access=document.querySelector('#access');
    if(!works||!announce||!access)return null;
    const w=works.getBoundingClientRect(),a=announce.getBoundingClientRect();
    // The phone catalog is taller than the screen, so a small scroll should stay inside Works.
    if(w.top<100&&w.top>-innerHeight*.4&&!works.querySelector('.is-list-mode')&&w.height<=innerHeight*1.2)return announce;
    // Keep both announcement chapters readable instead of skipping the fund.
    if(a.top<=40&&a.bottom>40){
      const fund=announce.querySelector('.announce-fund');
      if(fund&&fund.getBoundingClientRect().top>100)return fund;
      if(a.bottom<=innerHeight+140)return access;
    }
    return null;
  }
  // Proximity snap: once a user scroll comes to rest near a section edge, ease that edge to the top.
  // Sections taller than the screen stay freely scrollable; only edges close to the top attract,
  // and only in the direction of travel (plus a small overshoot correction).
  const SNAP_IDS=['concept','works','announce','access','members','archives'];
  // One auto-scroll per section: after a snap lands in a section, leave scrolling to the user
  // there until the viewport moves into a different section.
  const SNAP_SELECTOR=SNAP_IDS.map(id=>'#'+id).join(',');
  let snapLock=null;
  function sectionOf(element){return element?element.closest(SNAP_SELECTOR):null;}
  function sectionAt(){
    let current=null;
    for(const id of SNAP_IDS){
      const element=document.getElementById(id);
      if(element&&!element.inert&&element.getBoundingClientRect().top<=innerHeight*.5)current=element;
    }
    return current;
  }
  function unlocked(element){return element&&sectionOf(element)!==snapLock?element:null;}
  let settleTimer=0,lastInputAt=-Infinity,touching=false,direction=0,lastY=scrollY;
  function settle(){
    settleTimer=0;
    if(reducedMotion.matches||document.querySelector('dialog[open]')||sectionMoving||frameId||touching||performance.now()-lastInputAt>2000||
      window.conceptAutoScroll||window.heroAutoScroll||window.memberAutoScroll||window.memberEntryScroll)return;
    let best=null,distance=Infinity;
    for(const id of SNAP_IDS){
      const element=unlocked(document.getElementById(id));if(!element)continue;
      const d=element.getBoundingClientRect().top,ahead=direction>=0?d:-d;
      if(ahead>-innerHeight*.1&&ahead<innerHeight*.4&&Math.abs(d)<Math.abs(distance)){best=element;distance=d;}
    }
    const move=best?Math.min(limit(),best.getBoundingClientRect().top+scrollY)-scrollY:0;
    if(Math.abs(move)<=2)return false;
    snapSection(best,Math.min(800,380+Math.abs(move)*1.2));
    return true;
  }
  function userInput(){lastInputAt=performance.now();}
  addEventListener('scroll',()=>{
    if(Math.abs(scrollY-lastY)>.5&&!sectionMoving)direction=Math.sign(scrollY-lastY);
    lastY=scrollY;
    if(snapLock&&!sectionMoving&&sectionAt()!==snapLock)snapLock=null;
    clearTimeout(settleTimer);
    if(!sectionMoving&&performance.now()-lastInputAt<2000)settleTimer=setTimeout(settle,180);
  },{passive:true});
  addEventListener('wheel',userInput,{passive:true});
  addEventListener('touchstart',()=>{touching=true;clearTimeout(settleTimer);},{passive:true});
  ['touchend','touchcancel'].forEach(type=>addEventListener(type,()=>{touching=false;userInput();},{passive:true}));
  addEventListener('keydown',event=>{if(/^(Arrow(Up|Down)|Page(Up|Down)| )$/.test(event.key))userInput();});
  // Link and anchor jumps already land where they mean to; never snap them elsewhere.
  ['click','hashchange','popstate'].forEach(type=>addEventListener(type,()=>{lastInputAt=-Infinity;clearTimeout(settleTimer);},{capture:true}));
  ['concept-auto-scroll','hero-auto-scroll','member-auto-scroll'].forEach(type=>addEventListener(type,()=>{clearTimeout(settleTimer);if(sectionMoving)stopSection();}));

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
    } else if (Math.abs(target - position) < 6 && performance.now() - lastInputAt > 150 && (frameId = 0, settle())) {
      // The wheel has stopped: hand the last few pixels straight to the section snap.
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
    if(event.deltaY>0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&Math.abs(event.deltaY)>Math.abs(event.deltaX)&&!reducedMotion.matches&&!document.querySelector('dialog[open]')&&!nativeArea(event)&&!window.conceptAutoScroll&&!window.heroAutoScroll&&!window.memberAutoScroll&&!window.memberEntryScroll&&performance.now()>sectionCooldown){const next=unlocked(nextSection());if(next&&next.getBoundingClientRect().height){const now=performance.now();if(now-sectionIntentAt>500)sectionIntent=0;sectionIntentAt=now;sectionIntent+=Math.min(100,event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1));if(sectionIntent>=220){sectionIntent=0;if(event.cancelable)event.preventDefault();snapSection(next);return;}}else sectionIntent=0;}else sectionIntent=0;
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
