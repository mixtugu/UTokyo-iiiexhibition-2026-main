// Transparent red/blue discovery flow behind the FV artwork.
(() => {
  const pin = document.querySelector('.birth-pin');
  const journey = document.querySelector('.birth-journey');
  if (!pin || !journey) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'fv-flow-particles';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.width = 1440;
  canvas.height = 808;
  pin.prepend(canvas);

  const ctx = canvas.getContext('2d');
  const logo = document.querySelector('.hero-brush');
  const logoMask = document.createElement('canvas');
  logoMask.width = 560;
  logoMask.height = 560;
  const logoMaskContext = logoMask.getContext('2d', { willReadFrequently: true });
  let logoMaskReady = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const width = canvas.width;
  const height = canvas.height;
  const speed = .5;
  const spread = 145;
  const afterglow = 47;
  const blue = '#1535ff';
  const red = '#f03319';
  const clamp = value => Math.max(0, Math.min(1, value));
  let dots = [];
  let time = reducedMotion.matches ? 5.2 : 0;
  let last = performance.now();
  let frame = 0;
  let visible = true;
  const pointer = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2, active: false };
  let pointerLobes = [];
  let pointerLobesAt = 0;

  function scatterPointerLobes(now = performance.now()) {
    pointerLobesAt = now;
    pointerLobes = Array.from({ length: 11 }, (_, index) => ({
      x: (Math.random() - .5) * (70 + Math.random() * 150),
      y: (Math.random() - .5) * (45 + Math.random() * 105),
      rx: 13 + Math.random() * 35,
      ry: 9 + Math.random() * 27,
      seed: index * 17 + Math.random() * 91,
      strength: .45 + Math.random() * .55
    }));
  }

  const paths = [
    [.10,.72,.18,.73,.25,.64,.31,.61,.00,.21],
    [.31,.61,.37,.59,.42,.51,.49,.49,.18,.22],
    [.49,.49,.56,.44,.61,.36,.69,.34,.36,.22],
    [.69,.34,.76,.31,.83,.26,.91,.28,.54,.24],
    [.31,.61,.34,.72,.36,.81,.44,.82,.22,.24],
    [.44,.82,.51,.85,.61,.84,.70,.79,.45,.24],
    [.49,.49,.54,.56,.56,.66,.63,.69,.39,.21],
    [.63,.69,.70,.70,.77,.61,.84,.57,.56,.22],
    [.49,.49,.46,.42,.44,.31,.45,.24,.38,.22],
    [.45,.24,.50,.19,.59,.15,.66,.18,.57,.22],
    [.92,.76,.89,.69,.88,.61,.84,.57,.05,.22],
    [.84,.57,.79,.50,.74,.41,.69,.34,.27,.25],
    [.17,.22,.25,.20,.36,.23,.45,.24,.08,.26],
    [.45,.24,.47,.32,.48,.41,.49,.49,.31,.20],
    [.04,.43,.13,.45,.23,.55,.31,.61,.04,.25],
    [.35,.04,.38,.10,.41,.18,.45,.24,.02,.24],
    [.74,.04,.73,.13,.72,.25,.69,.34,.07,.25],
    [.97,.42,.92,.45,.88,.52,.84,.57,.11,.22],
    [.56,.96,.53,.91,.48,.85,.44,.82,.06,.21],
    [.79,.95,.77,.89,.74,.83,.70,.79,.12,.22],
    [.04,.88,.08,.83,.09,.77,.10,.72,.10,.20],
    [.95,.12,.90,.16,.86,.23,.91,.28,.03,.22]
  ];
  const seeds = new Set([0,10,12,14,15,16,17,18,19,20,21]);
  const widths = [14,28,38,24,17,26,32,20,16,18,12,30,13,24,11,15,21,12,18,11,14,16];
  const shuffled = [...seeds].sort(() => Math.random() - .5);
  const seedStates = new Map(shuffled.map((pathIndex, order) => [pathIndex, {
    birth: -100,
    next: .35 + order * .58 + Math.random() * .22,
    duration: 2.4 + Math.random() * 1.8
  }]));
  const opening = seedStates.get(shuffled[0]);
  opening.birth = -.12;
  opening.next = opening.duration + 2.2 + Math.random() * 4.5;

  function hash(x, y) {
    const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return value - Math.floor(value);
  }

  function gaussian(distance, radius) {
    const q = distance / radius;
    return Math.exp(-q * q * .5);
  }

  function point(path, u) {
    const v = 1 - u;
    const rawY = v*v*v*path[1] + 3*v*v*u*path[3] + 3*v*u*u*path[5] + u*u*u*path[7];
    return {
      x: (v*v*v*path[0] + 3*v*v*u*path[2] + 3*v*u*u*path[4] + u*u*u*path[6]) * width,
      y: (.5 + (rawY - .5) * (spread / 100)) * height
    };
  }

  function mapDot(dot) {
    let bestDistance = Infinity;
    let bestPath = 0;
    let bestProgress = 0;
    let nearby = 0;
    paths.forEach((path, pathIndex) => {
      let previous = point(path, 0);
      let pathDistance = Infinity;
      for (let step = 1; step <= 18; step += 1) {
        const current = point(path, step / 18);
        const vx = current.x - previous.x;
        const vy = current.y - previous.y;
        const length = vx*vx + vy*vy;
        const local = clamp(((dot.x - previous.x) * vx + (dot.y - previous.y) * vy) / length);
        const distance = Math.hypot(dot.x - (previous.x + local*vx), dot.y - (previous.y + local*vy));
        pathDistance = Math.min(pathDistance, distance);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestPath = pathIndex;
          bestProgress = ((step - 1) + local) / 18;
        }
        previous = current;
      }
      if (pathDistance < 34) nearby += 1;
    });
    dot.distance = bestDistance;
    dot.path = bestPath;
    dot.progress = bestProgress;
    dot.junction = clamp((nearby - 1) / 2);
  }

  function build() {
    dots = [];
    const spacing = 15;
    for (let y = spacing * .5; y < height; y += spacing) {
      for (let x = spacing * .5; x < width; x += spacing) {
        const dot = { x, y, h: hash(Math.round(x), Math.round(y)), memory: 0 };
        mapDot(dot);
        dots.push(dot);
      }
    }
  }

  function updateSeeds(now) {
    for (const state of seedStates.values()) {
      if (now < state.next) continue;
      state.birth = state.next;
      state.duration = 2.4 + Math.random() * 2.2;
      state.next = state.birth + state.duration + 1.8 + Math.random() * 6.5;
    }
  }

  function strength(dot, now) {
    const path = paths[dot.path];
    const route = path[8] + dot.progress * path[9];
    const cycle = (now * .115) % 1;
    let front = 0;
    let trace = 0;
    let fade = 1;
    let bloom = 0;
    if (seeds.has(dot.path)) {
      const state = seedStates.get(dot.path);
      const local = (now - state.birth) / state.duration;
      if (local >= 0 && local <= 1) {
        front = gaussian(local - dot.progress, .055);
        const behind = local - dot.progress;
        trace = behind >= 0 ? Math.max(0, 1 - behind * 1.8) : 0;
        fade = local < .86 ? 1 : Math.max(0, (1 - local) / .14);
        bloom = dot.junction * gaussian(local - dot.progress - .035, .075);
      }
    } else {
      front = gaussian(cycle - route, .034);
      const behind = cycle > route ? cycle - route : 1;
      trace = cycle > route ? Math.max(0, 1 - behind * 1.5) : 0;
      fade = cycle < .88 ? 1 : Math.max(0, (1 - cycle) / .12);
      bloom = dot.junction * gaussian(cycle - route - .028, .06);
    }
    const widthArc = .62 + Math.sin(Math.PI * dot.progress) * .5;
    const widthNoise = .86 + Math.sin(dot.progress * 10 + hash(dot.path, 7) * Math.PI * 2) * .2;
    const pathMask = gaussian(dot.distance, widths[dot.path] * widthArc * widthNoise);
    const pulse = Math.pow(Math.max(0, Math.sin(now * 2.1 + route * 26 + dot.h * 4)), 4);
    let active = pathMask * Math.max(front, trace * (.20 + pulse * .22), bloom * .72) * fade;
    if (pointer.active) {
      let irregularReveal = 0;
      for (const lobe of pointerLobes) {
        const dx = (dot.x - pointer.x - lobe.x) / lobe.rx;
        const dy = (dot.y - pointer.y - lobe.y) / lobe.ry;
        const cloud = Math.exp(-(dx * dx + dy * dy) * .5);
        const scatter = hash(dot.x * .071 + lobe.seed, dot.y * .053 - lobe.seed);
        const flicker = .72 + Math.sin(now * 3.1 + dot.h * 19 + lobe.seed) * .28;
        const brokenEdge = scatter > .28 ? .55 + scatter * .45 : .08;
        irregularReveal = Math.max(irregularReveal, cloud * brokenEdge * flicker * lobe.strength);
      }
      active = Math.max(active, irregularReveal);
    }
    return {
      active: clamp(active),
      bloom
    };
  }

  function draw(force = false) {
    ctx.clearRect(0, 0, width, height);
    for (const dot of dots) {
      const field = strength(dot, time);
      const retention = .72 + (afterglow / 100) * .255;
      dot.memory = force ? field.active : Math.max(field.active, dot.memory * retention);
      const active = dot.memory;
      const square = dot.h > .63;
      const color = square ? red : blue;
      const size = .34 + active * (square ? 1.05 : .9) + (field.bloom > .12 ? .12 : 0);
      ctx.globalAlpha = .11 + active * .84;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = active > .34 ? active * 4.5 : 0;
      if (square) ctx.fillRect(dot.x - size, dot.y - size, size * 2, size * 2);
      else {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (logoMaskReady) {
      // Keep the brush texture intact, but remove background particles from
      // every painted pixel so red and blue never show through the mark.
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(logoMask, 72, -274, 1392, 1392);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  function setScrollOpacity() {
    const travel = Math.max(0, -journey.getBoundingClientRect().top);
    canvas.style.opacity = String(clamp(1 - travel / (innerHeight * .72)));
  }

  function animate(now) {
    frame = 0;
    const elapsed = Math.min(.05, (now - last) / 1000);
    last = now;
    if (!reducedMotion.matches) {
      time += elapsed * speed;
      updateSeeds(time);
      pointer.x += (pointer.targetX - pointer.x) * Math.min(1, elapsed * 11);
      pointer.y += (pointer.targetY - pointer.y) * Math.min(1, elapsed * 11);
      if (pointer.active && now - pointerLobesAt > 720) scatterPointerLobes(now);
    }
    draw(false);
    if (visible && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(animate);
  }

  function start() {
    if (frame || !visible || document.hidden) return;
    last = performance.now();
    if (reducedMotion.matches) draw(true);
    else frame = requestAnimationFrame(animate);
  }

  build();
  scatterPointerLobes();
  logo.decode().then(() => {
    logoMaskContext.drawImage(logo, 0, 0, 560, 560);
    const frameData = logoMaskContext.getImageData(0, 0, 560, 560);
    for (let index = 3; index < frameData.data.length; index += 4) {
      frameData.data[index] = frameData.data[index] > 12 ? 255 : 0;
    }
    logoMaskContext.putImageData(frameData, 0, 0);
    logoMaskReady = true;
    draw(true);
  }).catch(() => {});
  draw(true);
  setScrollOpacity();
  addEventListener('scroll', setScrollOpacity, { passive: true });
  addEventListener('resize', setScrollOpacity);
  addEventListener('pointermove', event => {
    const rect = canvas.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    pointer.active = inside;
    if (!inside) return;
    pointer.targetX = (event.clientX - rect.left) * width / rect.width;
    pointer.targetY = (event.clientY - rect.top) * height / rect.height;
    if (reducedMotion.matches) {
      pointer.x = pointer.targetX;
      pointer.y = pointer.targetY;
      draw(true);
    }
  }, { passive: true });
  addEventListener('pointerout', event => {
    if (event.relatedTarget) return;
    pointer.active = false;
  }, { passive: true });
  addEventListener('pointercancel', () => { pointer.active = false; }, { passive: true });
  reducedMotion.addEventListener('change', () => {
    cancelAnimationFrame(frame);
    frame = 0;
    start();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else start();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else start();
  }).observe(journey);
  start();
})();
