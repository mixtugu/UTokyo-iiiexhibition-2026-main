(() => {
  const journey = document.querySelector('#scroll-journey');
  const stage = document.querySelector('.stage');
  const memberCanvas = document.querySelector('#marker-canvas');
  const particleCanvas = document.querySelector('#transition-canvas');
  const archivePanel = document.querySelector('#archives');
  const chapterLabel = document.querySelector('#chapter-label');
  const caption = document.querySelector('#journey-caption');
  const scrollCue = document.querySelector('#scroll-cue');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const context = particleCanvas.getContext('2d');
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const glide = value => {
    const t = clamp(value);
    const ramp = .15;
    const distance = 1 - ramp;
    if (t < ramp) return t * t / (2 * ramp * distance);
    if (t > 1 - ramp) return 1 - (1 - t) * (1 - t) / (2 * ramp * distance);
    return (t - ramp / 2) / distance;
  };
  const noise = value => {
    const x = Math.sin(value * 127.1 + 2026.9) * 43758.5453;
    return x - Math.floor(x);
  };
  let particles = [];
  let prepared = false;
  let completedMarker = false;
  let queued = false;
  let initialized = false;
  let playhead = 0;
  let target = 0;
  let animation = null;

  function sampleImage(data, width, height, step, map) {
    const points = [];
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
        if (data[index + 3] < 70) continue;
        // Retain the actual letter silhouette; don't sample transparent gaps.
        if (noise(x * 53 + y * 97) < .16) continue;
        points.push(map(x, y));
      }
    }
    return points;
  }

  function measureSource() {
    const artwork = window.membersMarkerPrototype?.artwork;
    if (!artwork) return [];
    const stageRect = stage.getBoundingClientRect();
    const memberRect = memberCanvas.getBoundingClientRect();
    const left = memberRect.left - stageRect.left;
    const top = memberRect.top - stageRect.top;
    if (window.membersMarkerSourcePoints) {
      // Exact glyph pixels, including when file:// prevents canvas pixel reads.
      const bytes = atob(window.membersMarkerSourcePoints);
      const points = [];
      for (let index = 0; index < bytes.length; index += 4) {
        const x = bytes.charCodeAt(index) + bytes.charCodeAt(index + 1) * 256;
        const y = bytes.charCodeAt(index + 2) + bytes.charCodeAt(index + 3) * 256;
        points.push({
          x: left + x / 1675 * memberRect.width,
          y: top + y / 939 * memberRect.height
        });
      }
      return points;
    }
    try {
      const image = artwork.getContext('2d', { willReadFrequently: true })
        .getImageData(0, 0, artwork.width, artwork.height);
      return sampleImage(image.data, image.width, image.height, 3, (x, y) => ({
        x: left + x / image.width * memberRect.width,
        y: top + y / image.height * memberRect.height
      }));
    } catch (error) {
      // Some file:// browsers block pixel reads; use the same letter-row guides.
      const points = [];
      document.querySelectorAll('.name-route').forEach((path, routeIndex) => {
        const length = path.getTotalLength();
        for (let distance = 0; distance < length; distance += 3) {
          const point = path.getPointAtLength(distance);
          for (let offset = -2; offset <= 2; offset++) {
            const jitter = (noise(distance * 5 + offset * 17 + routeIndex) - .5) * 32;
            points.push({
              x: left + (point.x + jitter) / 1675 * memberRect.width,
              y: top + (point.y + offset * 7) / 939 * memberRect.height
            });
          }
        }
      });
      return points;
    }
  }

  function measureTargets() {
    const width = Math.round(stage.clientWidth);
    const height = Math.round(stage.clientHeight);
    const layer = document.createElement('canvas');
    layer.width = width;
    layer.height = height;
    const ink = layer.getContext('2d', { willReadFrequently: true });
    const stageRect = stage.getBoundingClientRect();
    for (const span of archivePanel.querySelectorAll('.archive-list a span')) {
      const rect = span.getBoundingClientRect();
      if (rect.right < stageRect.left || rect.left > stageRect.right || rect.bottom < stageRect.top || rect.top > stageRect.bottom) continue;
      const style = getComputedStyle(span);
      ink.save();
      ink.beginPath();
      ink.rect(rect.left - stageRect.left, rect.top - stageRect.top, rect.width, rect.height);
      ink.clip();
      ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ink.textBaseline = 'middle';
      ink.fillStyle = '#20a35f';
      ink.fillText(span.textContent, rect.left - stageRect.left, rect.top - stageRect.top + rect.height / 2);
      ink.restore();
    }
    const image = ink.getImageData(0, 0, width, height);
    return sampleImage(image.data, width, height, 2, (x, y) => ({ x, y }));
  }

  function prepare() {
    if (!window.membersMarkerPrototype) return;
    const width = Math.max(1, Math.round(stage.clientWidth));
    const height = Math.max(1, Math.round(stage.clientHeight));
    const resolution = Math.min(devicePixelRatio || 1, 2);
    particleCanvas.width = Math.round(width * resolution);
    particleCanvas.height = Math.round(height * resolution);
    context.setTransform(resolution, 0, 0, resolution, 0, 0);
    const source = measureSource();
    const target = measureTargets();
    if (!source.length || !target.length) {
      prepared = false;
      update();
      return;
    }
    const particleLimit = matchMedia('(max-width: 700px)').matches ? 3600 : 6000;
    const count = Math.min(particleLimit, Math.max(source.length, target.length));
    particles = Array.from({ length: count }, (_, index) => ({
      from: source[Math.floor(index * source.length / count)],
      to: target[Math.floor(index * target.length / count)],
      seed: noise(index + 1),
      flow: noise(index * 7 + 3),
      float: noise(index * 13 + 9),
      pace: noise(index * 19 + 5),
      arrival: noise(index * 29 + 11)
    }));
    prepared = true;
    update();
  }

  function render() {
    const p = playhead;
    const reduced = reducedMotion.matches;
    if (p === 0 && target === 0) completedMarker = false;
    if (target === 1 && !completedMarker && window.membersMarkerPrototype) {
      window.membersMarkerPrototype.complete();
      completedMarker = true;
    }
    const memberOpacity = reduced ? (p < .5 ? 1 : 0) : 1 - ease((p - .13) / .43);
    // The particles must form the letters before the actual links replace them.
    const linkOpacity = reduced ? (p >= .5 ? 1 : 0) : ease((p - .965) / .035);
    memberCanvas.style.opacity = memberOpacity;
    archivePanel.style.opacity = linkOpacity;
    chapterLabel.textContent = p > .78 ? '06 / ARCHIVES' : '05 / MEMBERS';
    caption.textContent = p > .78 ? 'PAST EXHIBITIONS / OPEN A LINK ↗' : 'MARKER → NAMES → PARTICLES → ARCHIVES';
    scrollCue.style.opacity = 1 - ease((p - .02) / .12);
    const linksActive = reduced ? p >= .5 : p >= .99;
    archivePanel.inert = !linksActive;
    archivePanel.setAttribute('aria-hidden', String(!linksActive));
    archivePanel.style.pointerEvents = linksActive ? 'auto' : 'none';

    context.clearRect(0, 0, stage.clientWidth, stage.clientHeight);
    if (!prepared || reduced) return;
    const fadeOut = 1 - ease((p - .965) / .035);
    if (p <= .055 || fadeOut <= 0) return;
    // Give each speck its own launch, travel pace and arrival; keep every path smooth.
    context.save();
    context.fillStyle = '#20a35f';
    for (let index = 0; index < particles.length; index++) {
      const particle = particles[index];
      const liftStart = .055 + particle.seed * .31;
      const visibility = ease((p - liftStart) / .085);
      if (visibility <= 0) continue;
      context.globalAlpha = visibility * fadeOut * .84;
      const lift = ease((p - liftStart) / (.19 + particle.float * .14));
      const travelStart = liftStart + .045 + particle.flow * .1;
      const arrival = .855 + (particle.seed * .25 + particle.arrival * .75) * .11;
      const travel = Math.pow(glide((p - travelStart) / (arrival - travelStart)), .55 + particle.pace * 1.25);
      const drift = Math.sin(travel * Math.PI);
      const x = particle.from.x + (particle.to.x - particle.from.x) * travel
        + (particle.flow - .5) * 12 * drift;
      const y = particle.from.y + (particle.to.y - particle.from.y) * travel
        - (14 + particle.float * 12) * lift * (1 - travel);
      const size = 1.25 + particle.seed * .95 + .28 * ease((p - .82) / .13);
      context.fillRect(x, y, size, size);
    }
    context.restore();
  }

  function animatedValue(motion, now) {
    const elapsedMs = Math.max(0, now - motion.start);
    return motion.from + (motion.to - motion.from) * ease(elapsedMs / motion.duration);
  }

  function tick(now) {
    queued = false;
    if (animation) {
      const elapsed = clamp((now - animation.start) / animation.duration);
      playhead = animatedValue(animation, now);
      if (elapsed === 1) {
        playhead = animation.to;
        animation = null;
      }
    }
    render();
    if (animation) update();
  }

  function update() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(tick);
  }

  function syncScroll() {
    const distance = -journey.getBoundingClientRect().top;
    // A short scroll starts the entire journey; returning to the top reverses it.
    const nextTarget = distance > 24 ? 1 : distance < 4 ? 0 : target;
    if (!initialized) {
      initialized = true;
      target = nextTarget;
      playhead = nextTarget;
    } else if (nextTarget !== target) {
      const now = performance.now();
      if (animation) {
        playhead = animatedValue(animation, now);
      }
      target = nextTarget;
      const duration = (target === 1 ? 1950 : 1050) * Math.max(.3, Math.abs(target - playhead));
      animation = reducedMotion.matches ? null : { from: playhead, to: target, start: now, duration };
      if (reducedMotion.matches) playhead = target;
    }
    update();
  }

  window.addEventListener('members-marker-ready', () => {
    prepare();
    document.fonts.ready.then(prepare);
  });
  if (window.membersMarkerPrototype) {
    prepare();
    document.fonts.ready.then(prepare);
  }
  window.addEventListener('scroll', syncScroll, { passive: true });
  window.addEventListener('resize', () => { prepare(); syncScroll(); });
  reducedMotion.addEventListener('change', () => {
    animation = null;
    playhead = target;
    update();
  });
  syncScroll();
})();
