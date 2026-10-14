(() => {
  const canvas = document.querySelector('#marker-canvas');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const replay = document.querySelector('#replay');
  const sourceWidth = 1675;
  const sourceHeight = 939;
  const scale = canvas.width / sourceWidth;
  // The artwork lays the 1675x939 routes out inside a 1200px-wide frame.
  const artworkWidth = 1200, contentTop = 245, contentHeight = 760;
  const routeY = (y) => (contentTop + y * contentHeight / sourceHeight) * sourceWidth / artworkWidth;
  const green = '#20a35f';
  const markerWidth = 52;
  const paths = [...document.querySelectorAll('.name-route')];
  const groupStarts = [.42, .76, 1.10];
  const textDelay = .36;
  // The three brush stamps in the artwork, revealed last (1200px-wide frame).
  const stampRegions = [
    { x: 318, y: 54, width: 165, height: 190, cx: 400, cy: 145 },
    { x: 675, y: 142, width: 177, height: 188, cx: 763, cy: 237 },
    { x: 866, y: 205, width: 183, height: 179, cx: 958, cy: 296 }
  ];
  const motionReduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Phones show the finished drawing instead of animating it.
  const touchDevice = matchMedia('(hover: none) and (pointer: coarse), (max-width: 767px)');
  const staticMarker = () => motionReduced.matches || touchDevice.matches;
  const clamp = (number) => Math.max(0, Math.min(1, number));
  const ease = (number) => { const t = clamp(number); return t * t * (3 - 2 * t); };
  const points = paths.map((path) => {
    const length = path.getTotalLength();
    const samples = [];
    const at = (distance) => { const point = path.getPointAtLength(distance); return { x: point.x, y: routeY(point.y) }; };
    for (let distance = 0; distance < length; distance += 4) samples.push(at(distance));
    samples.push(at(length));
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
  const fullArtwork = document.createElement('canvas');
  fullArtwork.width = canvas.width; fullArtwork.height = canvas.height;
  const fullContext = fullArtwork.getContext('2d', { willReadFrequently: true });
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
    // Only allocate the stroke's own bounds instead of a full-size canvas per route.
    const pad = markerWidth + 18 + extension + 30;
    const xs = route.map((point) => point.x), ys = route.map((point) => point.y);
    const left = Math.max(0, Math.floor((Math.min(...xs) - pad) * scale));
    const top = Math.max(0, Math.floor((Math.min(...ys) - pad) * scale));
    const right = Math.min(canvas.width, Math.ceil((Math.max(...xs) + pad) * scale));
    const bottom = Math.min(canvas.height, Math.ceil((Math.max(...ys) + pad) * scale));
    const markerTexture = document.createElement('canvas');
    markerTexture.width = Math.max(1, right - left); markerTexture.height = Math.max(1, bottom - top);
    const textureContext = markerTexture.getContext('2d');
    textureContext.translate(-left, -top);
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
    return { canvas: markerTexture, left, top };
  }

  const markerTextures = markerRoutes.map(({ points: route, index }) => prepareMarkerTexture(route, index));

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
      trailContext.drawImage(markerTextures[index].canvas, markerTextures[index].left, markerTextures[index].top);
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
    const ratio = canvas.width / artworkWidth;
    stampRegions.forEach((stamp, index) => {
      const progress = ease((time - dotStart - index * .19) / .6);
      if (progress <= 0) return;
      const growth = .78 + .22 * progress;
      const width = stamp.width * ratio * growth, height = stamp.height * ratio * growth;
      context.save();
      context.globalAlpha = progress;
      context.drawImage(fullArtwork, stamp.x * ratio, stamp.y * ratio, stamp.width * ratio, stamp.height * ratio,
        stamp.cx * ratio - width / 2, stamp.cy * ratio - height / 2, width, height);
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
    if (staticMarker()) { render(totalDuration); finished=true;dispatchEvent(new Event('members-marker-complete'));return; }
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
  touchDevice.addEventListener('change', restart);
  // Fade the artwork's white paper to transparency so it sits on the page background.
  function removeWhite(target) {
    const pixels = target.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < pixels.data.length; index += 4) {
      const distance = Math.max(255 - pixels.data[index], 255 - pixels.data[index + 1], 255 - pixels.data[index + 2]);
      pixels.data[index + 3] = Math.round(pixels.data[index + 3] * clamp((distance - 3) / 20));
    }
    target.putImageData(pixels, 0, 0);
  }
  const image = new Image();
  image.src = 'assets/members-artwork-brush.png';
  image.decode().then(() => {
    fullContext.drawImage(image, 0, 0, canvas.width, canvas.height);
    removeWhite(fullContext);
    artworkContext.drawImage(fullArtwork, 0, 0);
    const ratio = canvas.width / artworkWidth;
    for (const stamp of stampRegions) artworkContext.clearRect(stamp.x * ratio, stamp.y * ratio, stamp.width * ratio, stamp.height * ratio);
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
    if (window.membersMarkerAutoStart !== false || staticMarker()) restart();
  }).catch(() => {
    canvas.setAttribute('aria-label', 'メンバーの画像を読み込めませんでした');
  });
})();
