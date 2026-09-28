(() => {
  const canvas = document.querySelector('#marker-canvas');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const replay = document.querySelector('#replay');
  const sourceWidth = 1675;
  const sourceHeight = 939;
  const scale = canvas.width / sourceWidth;
  const green = '#20a35f';
  const markerWidth = 52;
  const paths = [...document.querySelectorAll('.name-route')];
  const groupStarts = [.42, .76, 1.10];
  const textDelay = .36;
  const finalDots = [
    { x: 580, y: 65 },
    { x: 1050, y: 166 },
    { x: 1380, y: 336 }
  ];
  const motionReduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (number) => Math.max(0, Math.min(1, number));
  const ease = (number) => { const t = clamp(number); return t * t * (3 - 2 * t); };
  const points = paths.map((path) => {
    const length = path.getTotalLength();
    const samples = [];
    for (let distance = 0; distance < length; distance += 4) samples.push(path.getPointAtLength(distance));
    samples.push(path.getPointAtLength(length));
    return samples;
  });
  const nextStart = [...groupStarts];
  const markerRoutes = paths.map((path, index) => {
    const group = Number(path.dataset.group);
    const length = path.getTotalLength();
    const start = nextStart[group];
    const duration = Math.max(.58, Math.min(1.05, length / 1150));
    // Nearby name rows flow together instead of waiting for one row to finish.
    nextStart[group] += .22;
    return { points: points[index], group, index, start, duration, primary: path.dataset.primary === 'true' };
  });
  const textEnd = Math.max(...markerRoutes.map(({ start, duration }) => start + duration + textDelay));
  const dotStart = textEnd + .14;
  const totalDuration = dotStart + 1.45;
  const mask = document.createElement('canvas');
  mask.width = canvas.width; mask.height = canvas.height;
  const maskContext = mask.getContext('2d');
  const artwork = document.createElement('canvas');
  artwork.width = canvas.width; artwork.height = canvas.height;
  const artworkContext = artwork.getContext('2d');
  const revealed = document.createElement('canvas');
  revealed.width = canvas.width; revealed.height = canvas.height;
  const revealContext = revealed.getContext('2d');
  const markerTrail = document.createElement('canvas');
  markerTrail.width = canvas.width; markerTrail.height = canvas.height;
  const trailContext = markerTrail.getContext('2d');
  const trailMask = document.createElement('canvas');
  trailMask.width = canvas.width; trailMask.height = canvas.height;
  const trailMaskContext = trailMask.getContext('2d');
  let ready = false;
  let finished = false;
  const dotImages = finalDots.map((_,i)=>{const image=new Image();image.src=`assets/members-dot-${i+1}.png`;return image;});
  let startedAt = 0, playhead = 0, playbackRate = 2.6;
  let frame = 0;

  function trace(target, route, from, to) {
    if (to <= from) return false;
    const first = Math.floor(clamp(from) * (route.length - 1));
    const last = Math.ceil(clamp(to) * (route.length - 1));
    target.beginPath();
    target.moveTo(route[first].x * scale, route[first].y * scale);
    for (let index = first + 1; index <= last; index++) {
      target.lineTo(route[index].x * scale, route[index].y * scale);
    }
    return true;
  }

  function seededRandom(seed) {
    let value = seed;
    return () => {
      value = (Math.imul(value, 1664525) + 1013904223) | 0;
      return (value >>> 0) / 4294967296;
    };
  }

  function drawDryInk(target, route, seed, scratchCount = 54) {
    const random = seededRandom(seed);
    target.save();
    target.globalCompositeOperation = 'destination-out';
    target.lineCap = 'round';
    for (let scratch = 0; scratch < scratchCount; scratch++) {
      const at = Math.floor(random() * Math.max(1, route.length - 12));
      const count = 3 + Math.floor(random() * 20);
      const edge = scratch >= scratchCount * (36 / 54);
      const offset = edge
        ? (random() < .5 ? -1 : 1) * (markerWidth * .42 + random() * 10)
        : (random() - .5) * markerWidth * .84;
      target.globalAlpha = edge ? .65 + random() * .35 : .3 + random() * .55;
      target.lineWidth = (edge ? 3 + random() * 8 : 1 + random() * 3) * scale;
      target.beginPath();
      for (let step = 0; step < count && at + step < route.length - 1; step++) {
        const index = at + step;
        const point = route[index];
        const before = route[Math.max(0, index - 1)];
        const after = route[Math.min(route.length - 1, index + 1)];
        const dx = after.x - before.x, dy = after.y - before.y;
        const length = Math.hypot(dx, dy) || 1;
        const x = (point.x - dy / length * offset) * scale;
        const y = (point.y + dx / length * offset) * scale;
        if (step === 0) target.moveTo(x, y);
        else target.lineTo(x, y);
      }
      target.stroke();
    }
    target.restore();
  }

  function traceWithInkEnd(target, route, extension = 20) {
    if (!trace(target, route, 0, 1)) return false;
    const end = route[route.length - 1];
    const before = route[route.length - 3];
    const dx = end.x - before.x, dy = end.y - before.y;
    const length = Math.hypot(dx, dy) || 1;
    target.lineTo((end.x + dx / length * extension) * scale, (end.y + dy / length * extension) * scale);
    return true;
  }

  function traceOffset(target, route, offset) {
    target.beginPath();
    route.forEach((point, index) => {
      const before = route[Math.max(0, index - 2)];
      const after = route[Math.min(route.length - 1, index + 2)];
      const dx = after.x - before.x, dy = after.y - before.y;
      const length = Math.hypot(dx, dy) || 1;
      const x = (point.x - dy / length * offset) * scale;
      const y = (point.y + dx / length * offset) * scale;
      if (index === 0) target.moveTo(x, y);
      else target.lineTo(x, y);
    });
  }

  function featherFlatTip(target, route, progress, seed) {
    const index = Math.ceil(clamp(progress) * (route.length - 1));
    const point = route[index];
    const before = route[Math.max(0, index - 2)];
    const dx = point.x - before.x, dy = point.y - before.y;
    target.save();
    target.translate(point.x * scale, point.y * scale);
    target.rotate(Math.atan2(dy, dx));
    const width = (markerWidth + 20) * scale;
    const bandHeight = width / 12;
    for (let band = 0; band < 12; band++) {
      // A nearly flat, slightly angled nib with a different soft edge for each band.
      const irregularity = Math.sin(band * 8.7 + seed * 3.1) * 2.1 * scale;
      const end = (12 + (band - 5.5) * .65) * scale + irregularity;
      const fade = target.createLinearGradient(-2 * scale, 0, end, 0);
      fade.addColorStop(0, 'rgba(255,255,255,1)');
      fade.addColorStop(.35, 'rgba(255,255,255,.9)');
      fade.addColorStop(1, 'rgba(255,255,255,0)');
      target.fillStyle = fade;
      target.fillRect(-2 * scale, -width / 2 + band * bandHeight, end + 2 * scale, bandHeight + .6);
    }
    target.restore();
  }

  function prepareMarkerTexture(route, index, extension = 20, scratchCount = 54) {
    const markerTexture = document.createElement('canvas');
    markerTexture.width = canvas.width; markerTexture.height = canvas.height;
    const textureContext = markerTexture.getContext('2d');
    textureContext.save();
    textureContext.lineCap = 'butt';
    textureContext.lineJoin = 'round';
    // A soft transmitted-light edge, rather than a flat opaque green ribbon.
    textureContext.strokeStyle = 'rgba(125, 225, 116, .23)';
    textureContext.lineWidth = (markerWidth + 18) * scale;
    textureContext.shadowColor = 'rgba(105, 214, 126, .42)';
    textureContext.shadowBlur = 15 * scale;
    if (traceWithInkEnd(textureContext, route, extension)) textureContext.stroke();
    textureContext.shadowBlur = 0;
    const first = route[0], last = route[route.length - 1];
    const light = textureContext.createLinearGradient(first.x * scale, first.y * scale, last.x * scale, last.y * scale);
    light.addColorStop(0, 'rgba(104, 207, 78, .76)');
    light.addColorStop(.38, 'rgba(83, 198, 136, .68)');
    light.addColorStop(.72, 'rgba(164, 222, 87, .72)');
    light.addColorStop(1, 'rgba(96, 205, 119, .72)');
    textureContext.strokeStyle = light;
    textureContext.lineWidth = markerWidth * scale;
    if (traceWithInkEnd(textureContext, route, extension)) textureContext.stroke();
    drawDryInk(textureContext, route, 2026 + index * 37, scratchCount);
    // A narrow dark edge and a broad, broken reflection give the stroke depth.
    textureContext.lineCap = 'round';
    textureContext.strokeStyle = 'rgba(24, 126, 105, .22)';
    textureContext.lineWidth = 6 * scale;
    traceOffset(textureContext, route, markerWidth * .36);
    textureContext.stroke();
    textureContext.strokeStyle = 'rgba(250, 255, 213, .58)';
    textureContext.lineWidth = 12 * scale;
    traceOffset(textureContext, route, -markerWidth * .27);
    textureContext.stroke();
    textureContext.strokeStyle = 'rgba(255, 255, 245, .72)';
    textureContext.lineWidth = 3.5 * scale;
    traceOffset(textureContext, route, -markerWidth * .36);
    textureContext.stroke();
    textureContext.restore();
    return markerTexture;
  }

  const markerTextures = markerRoutes.map(({ points: route, index }) => prepareMarkerTexture(route, index));

  function irregularDrop(target, radius, seed, fillStyle, roughness = 1) {
    const random = seededRandom(seed);
    target.beginPath();
    for (let point = 0; point <= 72; point++) {
      const angle = point / 72 * Math.PI * 2;
      const wobble = 1 + roughness * (.055 * Math.sin(angle * 5 + seed) + .035 * Math.sin(angle * 11 - seed * .4));
      const edge = radius * (wobble + (random() - .5) * .025 * roughness);
      const x = Math.cos(angle) * edge, y = Math.sin(angle) * edge;
      if (point === 0) target.moveTo(x, y);
      else target.lineTo(x, y);
    }
    target.closePath();
    target.fillStyle = fillStyle;
    target.fill();
  }

  function makeInkDrop(index) {
    const random = seededRandom(2771 + index * 7919);
    // Three related drops, but with distinct paper absorption and pigment density.
    const style = {
      stretchX: [1.16, .86, 1.04][index] + (random() - .5) * .08,
      stretchY: [.84, 1.14, .96][index] + (random() - .5) * .08,
      rotation: [-.32, .4, -.12][index] + (random() - .5) * .12,
      roughness: [.65, 1.3, .95][index] + random() * .16,
      bleedRadius: [29, 26, 33][index] + random() * 2,
      coreRadius: [17, 14, 18][index] + random() * 1.5,
      bleedOpacity: [.75, 1.15, .9][index] + random() * .12,
      coreOpacity: [.95, .72, .84][index] + random() * .08,
      fiberCount: [145, 95, 185][index] + Math.floor(random() * 18),
      duration: [.65, .48, .78][index] + random() * .04,
      bloomDelay: [.18, .28, .11][index]
    };
    const makeLayer = () => {
      const layer = document.createElement('canvas');
      layer.width = 100; layer.height = 100;
      const ink = layer.getContext('2d');
      ink.translate(50, 50);
      return { layer, ink };
    };
    const bloom = makeLayer();
    bloom.ink.rotate(style.rotation);
    bloom.ink.scale(style.stretchX, style.stretchY);
    const diffusion = bloom.ink.createRadialGradient(-2, -3, 5, 0, 0, style.bleedRadius + 4);
    diffusion.addColorStop(0, `rgba(125, 225, 116, ${.16 * style.bleedOpacity})`);
    diffusion.addColorStop(.52, `rgba(105, 214, 126, ${.11 * style.bleedOpacity})`);
    diffusion.addColorStop(1, 'rgba(105, 214, 126, 0)');
    bloom.ink.fillStyle = diffusion;
    bloom.ink.beginPath();
    bloom.ink.arc(0, 0, style.bleedRadius + 4, 0, Math.PI * 2);
    bloom.ink.fill();
    irregularDrop(bloom.ink, style.bleedRadius * .78, 601 + index * 41,
      `rgba(104, 207, 78, ${.065 * style.bleedOpacity})`, style.roughness);
    const fibers = seededRandom(934 + index * 71);
    for (let fiber = 0; fiber < style.fiberCount; fiber++) {
      const angle = fibers() * Math.PI * 2;
      const radius = style.coreRadius * .8 + fibers() * (style.bleedRadius - style.coreRadius * .5);
      const length = .7 + fibers() * (2.5 + style.roughness * 2);
      bloom.ink.strokeStyle = `rgba(64, 184, 58, ${(.025 + fibers() * .085) * style.bleedOpacity})`;
      bloom.ink.lineWidth = .35 + fibers() * .75;
      bloom.ink.beginPath();
      bloom.ink.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      bloom.ink.lineTo(Math.cos(angle) * (radius + length), Math.sin(angle) * (radius + length));
      bloom.ink.stroke();
    }
    const core = makeLayer();
    core.ink.rotate(style.rotation);
    core.ink.scale(style.stretchX, style.stretchY);
    irregularDrop(core.ink, style.coreRadius + 4, 319 + index * 53,
      `rgba(104, 207, 78, ${.18 * style.coreOpacity})`, style.roughness * .8);
    const pigment = core.ink.createRadialGradient(-3, -4, 1, 0, 0, style.coreRadius + 2);
    pigment.addColorStop(0, `rgba(104, 207, 78, ${.86 * style.coreOpacity})`);
    pigment.addColorStop(.58, `rgba(83, 198, 136, ${.73 * style.coreOpacity})`);
    pigment.addColorStop(1, `rgba(164, 222, 87, ${.32 * style.coreOpacity})`);
    irregularDrop(core.ink, style.coreRadius, 117 + index * 29, pigment, style.roughness);
    const patches = seededRandom(451 + index * 101);
    for (let patch = 0; patch < 7 + index * 3; patch++) {
      const angle = patches() * Math.PI * 2;
      const radius = patches() * style.coreRadius * .75;
      core.ink.fillStyle = `rgba(64, 184, 58, ${.035 + patches() * .1})`;
      core.ink.beginPath();
      core.ink.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, 1 + patches() * 3, 0, Math.PI * 2);
      core.ink.fill();
    }
    return { bloom: bloom.layer, core: core.layer, style };
  }

  const inkDrops = finalDots.map((_, index) => makeInkDrop(index));

  function addTipGlow(target, route, progress) {
    if (progress >= 1) return;
    const tip = route[Math.ceil(progress * (route.length - 1))];
    const x = tip.x * scale, y = tip.y * scale;
    const glow = target.createRadialGradient(x, y, 0, x, y, 43 * scale);
    glow.addColorStop(0, 'rgba(255, 255, 224, .82)');
    glow.addColorStop(.28, 'rgba(226, 255, 161, .38)');
    glow.addColorStop(1, 'rgba(226, 255, 161, 0)');
    target.save();
    target.globalCompositeOperation = 'source-atop';
    target.fillStyle = glow;
    target.fillRect(x - 43 * scale, y - 43 * scale, 86 * scale, 86 * scale);
    target.restore();
  }

  function drawMarkers(time) {
    markerRoutes.forEach(({ points: route, index, start, duration }) => {
      const progress = ease((time - start) / duration);
      const revealProgress = ease((time - start - textDelay) / duration);
      if (progress <= revealProgress) return;
      trailMaskContext.clearRect(0, 0, trailMask.width, trailMask.height);
      trailMaskContext.save();
      trailMaskContext.strokeStyle = '#fff';
      trailMaskContext.lineWidth = (markerWidth + 20) * scale;
      trailMaskContext.lineCap = 'butt';
      trailMaskContext.lineJoin = 'round';
      if (trace(trailMaskContext, route, revealProgress, progress)) {
        trailMaskContext.stroke();
        featherFlatTip(trailMaskContext, route, progress, index);
      }
      trailMaskContext.restore();
      trailContext.clearRect(0, 0, markerTrail.width, markerTrail.height);
      trailContext.drawImage(markerTextures[index], 0, 0);
      trailContext.globalCompositeOperation = 'destination-in';
      trailContext.drawImage(trailMask, 0, 0);
      trailContext.globalCompositeOperation = 'source-over';
      addTipGlow(trailContext, route, progress);
      context.drawImage(markerTrail, 0, 0);
    });
    markerRoutes.forEach(({ points: route, primary, start }) => {
      const pointOpacity = 1 - ease((time - start - textDelay) / .28);
      if (!primary || time < start || pointOpacity <= 0) return;
      context.save();
      context.globalAlpha = pointOpacity;
      context.fillStyle = green;
      context.beginPath();
      context.arc(route[0].x * scale, route[0].y * scale, 6.5 * scale, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });
  }

  function drawNames(time) {
    if (!ready) return;
    if(time>=textEnd){context.drawImage(artwork,0,0);return;}
    maskContext.clearRect(0, 0, mask.width, mask.height);
    maskContext.save();
    maskContext.strokeStyle = '#fff';
    maskContext.lineCap = 'round'; maskContext.lineJoin = 'round';
    markerRoutes.forEach(({ points: route, start, duration }) => {
      // A name can only appear after this exact row has been marked.
      const progress = ease((time - start - textDelay) / duration);
      // Keep the image reveal wide enough to include every glyph, independently
      // of small visual adjustments to the marker's thickness.
      maskContext.lineWidth = 76 * scale;
      if (trace(maskContext, route, 0, progress)) maskContext.stroke();
    });
    maskContext.restore();
    // Finish the reveal continuously, including glyphs beyond the guide stroke.
    maskContext.save();maskContext.globalAlpha=ease((time-textEnd+.4)/.4);maskContext.fillStyle='#fff';maskContext.fillRect(0,0,mask.width,mask.height);maskContext.restore();
    revealContext.clearRect(0, 0, revealed.width, revealed.height);
    revealContext.drawImage(artwork, 0, 0);
    revealContext.globalCompositeOperation = 'destination-in';
    revealContext.drawImage(mask, 0, 0);
    revealContext.globalCompositeOperation = 'source-over';
    context.drawImage(revealed, 0, 0);
  }

  function drawFinalDots(time) {
    finalDots.forEach((dot, index) => {
      const asset=dotImages[index];
      if(asset.complete && asset.naturalWidth){
        const progress=ease((time-dotStart-index*.19)/.6);
        if(progress<=0)return;
        context.save();context.globalAlpha=progress;
        const slot=[{x:526.03,y:5.02},{x:765.02,y:100.99},{x:951.97,y:179.98}][index];
        const ratio=canvas.width/1440,top=(canvas.height-760*ratio)/2;
        const width=219.89*ratio,height=194.56*ratio,growth=.9+.1*progress;
        context.drawImage(asset,slot.x*ratio+width*(1-growth)/2,top+slot.y*ratio+height*(1-growth)/2,width*growth,height*growth);
        context.restore();return;
      }
      const { bloom, core, style } = inkDrops[index];
      const progress = clamp((time - dotStart - index * .19) / style.duration);
      if (progress <= 0) return;
      const x = dot.x * scale, y = dot.y * scale;
      context.save();
      context.translate(x, y);
      const spread = ease((progress - style.bloomDelay) / (1 - style.bloomDelay));
      context.globalAlpha = spread;
      context.save();
      context.scale(.68 + spread * .32, .68 + spread * .32);
      context.drawImage(bloom, -50, -50);
      context.restore();
      context.globalAlpha = ease(progress * (2.1 + style.coreOpacity * .5));
      const coreScale = .3 + .7 * ease(progress / (.55 + style.bloomDelay * .35));
      context.scale(coreScale, coreScale);
      context.drawImage(core, -50, -50);
      context.restore();
    });
  }

  function render(time) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawMarkers(time);
    drawNames(time);
    drawFinalDots(time);
  }

  function tick(now) {
    playhead += Math.min((now-startedAt)/1000,.05)*playbackRate;
    startedAt=now;
    const time = Math.min(playhead, totalDuration);
    render(time);
    if (time < totalDuration) frame = requestAnimationFrame(tick);
    else {finished=true;dispatchEvent(new Event('members-marker-complete'));}
  }

  function restart() {
    cancelAnimationFrame(frame);
    if (!ready) return;
    finished=false;
    if (motionReduced.matches) { render(totalDuration); finished=true;dispatchEvent(new Event('members-marker-complete'));return; }
    startedAt = performance.now();
    playhead=0;playbackRate=2.6;
    frame = requestAnimationFrame(tick);
  }

  replay?.addEventListener('click', () => {
    if (window.scrollY > 8) {
      window.scrollTo({ top: 0, behavior: motionReduced.matches ? 'instant' : 'smooth' });
    }
    restart();
  });
  motionReduced.addEventListener('change', restart);
  const nameSlots=[
    {x:15+1311*.0845,y:112+633*.2157,w:1311*.7706,h:633*.7112},
    {x:15+1311*.0557,y:112+633*.1106,w:1311*.8888,h:633*.8888},
    {x:15+1311*.1684,y:112+633*.313,w:1311*.1383,h:633*.1322}
  ];
  const nameImages=nameSlots.map((_,i)=>{const image=new Image();image.src=`assets/members-names-${i+1}.svg`;return image;});
  Promise.all([...nameImages,...dotImages].map(image=>image.decode())).then(() => {
    const ratio=canvas.width/1440,top=(canvas.height-760*ratio)/2;
    nameImages.forEach((image,i)=>{const slot=nameSlots[i];artworkContext.drawImage(image,slot.x*ratio,top+slot.y*ratio,slot.w*ratio,slot.h*ratio);});
    ready = true;
    window.membersMarkerPrototype = {
      canvas,
      artwork,
      restart,
      finishSoon(){playbackRate=Math.max(playbackRate,(totalDuration-playhead)/.28);},
      pause(){cancelAnimationFrame(frame);},
      get finished(){return finished;},
      complete() {
        cancelAnimationFrame(frame);
        render(totalDuration);
        finished=true;
        dispatchEvent(new Event('members-marker-complete'));
      }
    };
    window.dispatchEvent(new Event('members-marker-ready'));
    if (window.membersMarkerAutoStart !== false || motionReduced.matches) restart();
  }).catch(() => {
    canvas.setAttribute('aria-label', 'メンバーの画像を読み込めませんでした');
  });
})();
