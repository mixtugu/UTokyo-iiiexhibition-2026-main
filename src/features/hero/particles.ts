interface HeroParticle {
  u: number;
  v: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  seed: number;
  release: number;
  bubble: number;
  phase: number;
  stream: number;
  farX: number;
  farY: number;
  color: string;
}
import { clamp, smoothstep as ease } from '../../lib/math';
import { qs, context2d } from '../../lib/dom';
export function initHeroParticles() {
  const hero = qs('.hero');
  const art = qs('.hero-art', hero);
  const logo = qs<HTMLImageElement>('.hero-logo', art);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-particles';
  canvas.setAttribute('aria-hidden', 'true');
  const availableContext = canvas.getContext('2d');
  if (!availableContext) return;
  const ctx = availableContext;
  const concept = qs('#concept');
  const journey = document.createElement('div');
  journey.className = 'birth-journey';
  const pin = document.createElement('div');
  pin.className = 'birth-pin';
  pin.setAttribute('aria-hidden', 'true');
  const content = document.createElement('div');
  content.className = 'birth-content';
  const intro = document.createElement('div');
  intro.className = 'birth-intro';
  hero.before(journey);
  journey.append(pin, content);
  content.append(intro, concept);
  intro.append(hero);
  pin.append(art);

  let transition = 0,
    ascent = 0;
  function scrollState() {
    const offset = -journey.getBoundingClientRect().top;
    const h = pin.clientHeight || innerHeight;
    transition = reduced.matches ? 0 : clamp(offset / (h * 1.7));
    ascent = clamp((offset / h - 1.0) / 2.4);
    const fade = ease((transition - 0.08) / 0.48);
    hero.style.opacity = String(1 - fade);
    hero.inert = fade > 0.98;
    const color = ease(transition);
    pin.style.backgroundColor =
      'rgb(' +
      [
        233 + (64 - 233) * color,
        237 + (184 - 237) * color,
        223 + (58 - 223) * color,
      ]
        .map(Math.round)
        .join(',') +
      ')';
  }
  addEventListener('scroll', scrollState, { passive: true });
  addEventListener('resize', scrollState);
  scrollState();
  let dots: HeroParticle[] = [];
  let width = 0,
    height = 0,
    size = 0,
    cx = 0,
    cy = 0,
    visible = true,
    frame = 0,
    last = 0,
    loaded = false;
  let motionTime = 0;
  const pointer = { x: -10000, y: -10000, last: -10000, amount: 0 };
  const random = (n: number) => {
    const r = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return r - Math.floor(r);
  };
  function layout() {
    const r = art.getBoundingClientRect();
    width = r.width;
    height = r.height;
    const mobile = width <= 700;
    size = mobile
      ? Math.min(width * 0.94, height * 0.64)
      : Math.min(width * 0.7, height * 0.98);
    cx = width * (mobile ? 0.5 : 0.65);
    cy = height * (mobile ? 0.69 : 0.52);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots.forEach((p) => {
      p.x = cx + p.u * size;
      p.y = cy + p.v * size;
      p.vx = p.vy = p.release = 0;
    });
    pointer.amount = 0;
    pointer.last = -10000;
    if (loaded) {
      draw(performance.now(), true);
      start();
    }
  }
  function draw(now: number, still = false) {
    const dt = Math.min(2, (now - last) / 16.667 || 1);
    last = now;
    if (!still) motionTime += dt / 60;
    const t = motionTime * 0.22;
    // A resting pointer also releases the shape; movement wakes it again.
    const awake = !still && now - pointer.last < 900;
    pointer.amount +=
      (Number(awake) - pointer.amount) *
      (1 - Math.exp(-dt / (awake ? 12 : 28)));
    ctx.clearRect(0, 0, width, height);
    // One population, sampled from the logo. No fixed logo underlay and no
    // independent ambient particles: every visible grain leaves and comes home.
    const radius = width < 700 ? 105 : 165;
    const cr = concept.getBoundingClientRect();
    const merge = ease((height - cr.top) / (height * 0.75));
    const end = ease((height * 1.1 - cr.bottom) / (height * 0.85));
    for (const p of dots) {
      const bx = cx + p.u * size,
        by = cy + p.v * size;
      let tx = bx,
        ty = by;
      if (!still) {
        // No stationary hold: a slow continuous tide carries every grain.
        // Most stay close to the brush mark while successive cohorts flow out.
        const cycle = motionTime / 64 + p.phase;
        const tide = Math.pow((1 - Math.cos(cycle * Math.PI * 2)) / 2, 6);
        const dx = p.x - pointer.x,
          dy = p.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        const influence =
          Math.pow(Math.max(0, 1 - distance / radius), 2) * pointer.amount;
        p.release += (influence * 0.45 - p.release) * (1 - Math.exp(-dt / 110));
        const travel = tide + (1 - tide) * p.release;
        // Curved shared currents connect logo coordinates to the whole canvas.
        const stream = p.stream;
        const farX = (0.06 + p.farX * 0.88) * width;
        const farY = (0.06 + p.farY * 0.88) * height;
        const bend = Math.sin(travel * Math.PI);
        tx =
          bx + (farX - bx) * travel + Math.sin(t + stream) * width * 0.1 * bend;
        ty =
          by +
          (farY - by) * travel +
          Math.cos(t * 0.8 + stream) * height * 0.13 * bend;
        // Independent local circulation is visible inside the logo as well.
        const local = t + p.phase * Math.PI * 2;
        tx += Math.sin(local + p.v * 8) * (7 + p.seed * 5);
        ty += Math.cos(local * 0.85 + p.u * 9) * (6 + p.seed * 4);
        if (influence > 0) {
          const safe = Math.max(4, distance);
          // Local tangent flow, not a target cell or a new geometric shape.
          tx += ((-dy / safe) * 50 + (dx / safe) * 30) * influence;
          ty += ((dx / safe) * 50 + (dy / safe) * 30) * influence;
        }
        // Damped springs bring every point back to its sampled logo location.
        p.vx = (p.vx + (tx - p.x) * 0.008 * dt) * Math.pow(0.86, dt);
        p.vy = (p.vy + (ty - p.y) * 0.008 * dt) * Math.pow(0.86, dt);
        // Limit speed even when the cursor moves abruptly or the tab resumes.
        const speed = Math.hypot(p.vx, p.vy),
          limit = width < 700 ? 0.32 : 0.45;
        if (speed > limit) {
          p.vx *= limit / speed;
          p.vy *= limit / speed;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      } else {
        p.x = bx;
        p.y = by;
      }
      ctx.fillStyle = p.color;
      const dot = (width < 700 ? 1.05 : 1.4) + p.seed * 0.65;
      let renderX = p.x,
        renderY = p.y;
      if (!reduced.matches) {
        const gather = ease(transition / 0.65);
        const boil = ease((transition - 0.4) / 0.6);
        // Keep a deep, soft-edged cloud at the bottom, never a thin wave line.
        const poolX = width * (0.03 + p.farX * 0.94);
        const cloud = p.farY + p.seed + p.phase - 1.5;
        const poolY =
          height * (0.91 + cloud * 0.18) +
          Math.sin(p.farX * 15 + t) * height * 0.022;
        // Only a small share of the same grains forms a rising puff; the
        // majority remains in the cloud. Gaussian falloff avoids solid edges.
        const group = p.bubble;
        const phase = t * 0.55 + group * 1.73;
        const lift = (1 - Math.cos(phase)) * 0.5;
        const swell = 0.55 + 0.45 * Math.sin(lift * Math.PI);
        const r =
          width *
          (width < 700 ? 0.065 : 0.037) *
          swell *
          (0.65 + random(group + 700) * 0.65);
        const angle = p.phase * Math.PI * 2;
        const lobe = 1 + 0.07 * Math.sin(angle * 3 + phase);
        const radial =
          Math.sqrt(-2 * Math.log(Math.max(0.005, p.seed))) * r * lobe;
        const bubbleX =
          width * (0.08 + random(group + 600) * 0.84) +
          Math.sin(phase * 0.7) * width * 0.035;
        const bubbleY = height * (0.94 - lift * (0.14 + ascent * 0.51));
        const buoyant = p.farY > 0.72;
        const targetX = buoyant ? bubbleX + Math.cos(angle) * radial : poolX;
        const targetY = buoyant
          ? bubbleY + Math.sin(angle) * radial * (1.1 + 0.25 * Math.sin(phase))
          : poolY;
        const emergence = boil * ease(lift * 3);
        const x = poolX + (targetX - poolX) * emergence;
        const y = poolY + (targetY - poolY) * emergence;
        renderX += (x - renderX) * gather;
        renderY += (y - renderY) * gather;
      }
      if (merge > 0 && !reduced.matches) {
        const level = p.farY;
        const theta =
          motionTime * 0.32 +
          ((p.bubble % 3) * Math.PI * 2) / 3 +
          p.phase * 0.65 +
          level * 15 -
          (cr.top / height) * 0.8;
        const funnel = width * (0.045 + level * 0.24) * (0.72 + p.seed * 0.28);
        const sx = width * 0.5 + Math.cos(theta) * funnel;
        const sy =
          height * (0.88 - level * 0.78) + Math.sin(theta) * height * 0.055;
        renderX += (sx - renderX) * merge;
        renderY += (sy - renderY) * merge;
        ctx.fillStyle =
          'rgba(' +
          Math.round(60 + 195 * merge) +
          ',' +
          Math.round(185 + 70 * merge) +
          ',' +
          Math.round(50 + 205 * merge) +
          ',' +
          (0.3 + p.seed * 0.5) +
          ')';
      }
      ctx.globalAlpha = 1 - end;
      // Uniform rendering everywhere, including behind foreground text.
      ctx.fillRect(renderX - dot / 2, renderY - dot / 2, dot, dot);
      ctx.globalAlpha = 1;
    }
  }
  function loop(now: number) {
    frame = 0;
    if (!visible || document.hidden || reduced.matches) return;
    draw(now);
    frame = requestAnimationFrame(loop);
  }
  function start() {
    if (loaded && visible && !document.hidden && !reduced.matches && !frame) {
      last = performance.now();
      frame = requestAnimationFrame(loop);
    }
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }
  journey.addEventListener(
    'pointermove',
    (event) => {
      if (
        reduced.matches ||
        (event.target instanceof Element && event.target.closest('a,button'))
      )
        return;
      const r = art.getBoundingClientRect();
      const x = event.clientX - r.left,
        y = event.clientY - r.top;
      if (Math.hypot(x - pointer.x, y - pointer.y) > 2) {
        pointer.x = x;
        pointer.y = y;
        pointer.last = performance.now();
      }
    },
    { passive: true },
  );
  journey.addEventListener('pointerleave', () => (pointer.last = -10000), {
    passive: true,
  });
  journey.addEventListener(
    'pointerdown',
    (event) => {
      if (
        reduced.matches ||
        (event.target instanceof Element && event.target.closest('a,button'))
      )
        return;
      const r = art.getBoundingClientRect();
      pointer.x = event.clientX - r.left;
      pointer.y = event.clientY - r.top;
      pointer.last = performance.now();
    },
    { passive: true },
  );
  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      visible ? start() : stop();
    },
    { threshold: 0 },
  ).observe(journey);
  new ResizeObserver(layout).observe(art);
  document.addEventListener('visibilitychange', () =>
    document.hidden ? stop() : start(),
  );
  reduced.addEventListener('change', () => {
    stop();
    pointer.amount = 0;
    scrollState();
    if (loaded) draw(performance.now(), true);
    start();
  });
  logo
    .decode()
    .then(() => {
      const resolution = 560;
      const sample = document.createElement('canvas');
      sample.width = sample.height = resolution;
      const g = context2d(sample, { willReadFrequently: true });
      g.drawImage(logo, 0, 0, resolution, resolution);
      const pixels = g.getImageData(0, 0, resolution, resolution).data;
      for (let y = 0; y < resolution; y += 2)
        for (let x = 0; x < resolution; x += 2) {
          const i = (y * resolution + x) * 4;
          if (
            pixels[i + 3] < 80 ||
            pixels[i + 1] < pixels[i] * 1.15 ||
            pixels[i + 1] < 60
          )
            continue;
          const n = dots.length,
            seed = random(n);
          dots.push({
            u: (x + random(n + 5) - 0.5) / resolution - 0.5,
            v: (y + random(n + 7) - 0.5) / resolution - 0.5,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            seed,
            release: 0,
            bubble: Math.floor(random(n + 31) * 11),
            phase: random(n + 11),
            stream: Math.floor(random(n + 19) * 5) * 1.25,
            farX: random(n + 23),
            farY: random(n + 29),
            color:
              'rgba(' +
              pixels[i] +
              ',' +
              pixels[i + 1] +
              ',' +
              pixels[i + 2] +
              ',' +
              (0.65 + seed * 0.3) +
              ')',
          });
        }
      if (!dots.length) return;
      art.append(canvas);
      loaded = true;
      layout();
      hero.classList.add('has-particle-logo');
      start();
    })
    .catch((error) => console.warn('Keeping original logo:', error));
}
