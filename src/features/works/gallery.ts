import { designNumber } from '../../design/read-tokens';
import { actionButton } from '../../components/action';
import galleryMarkup from './gallery.html?raw';
import { workCard, venueName } from '../../components/work-card';
import { qs, qsa, context2d } from '../../lib/dom';
import type { Work } from '../../types';
import type { WorkDialog } from './dialog';
export function initWorksGallery(works: readonly Work[], detail: WorkDialog) {
  const section = qs('#works');

  const ui = document.createElement('div');
  ui.className = 'wave-gallery spatial-gallery';
  ui.innerHTML = galleryMarkup;
  section.append(ui);

  const search = document.createElement('div');
  search.className = 'wave-search';
  search.innerHTML =
    '<label>作品を探す <input type="search" placeholder="作品名・作者名・作品番号" aria-label="作品名・作者名・作品番号で検索"></label><span role="status"></span>';
  qs('.wave-toolbar', ui).after(search);
  const empty = document.createElement('p');
  empty.className = 'wave-empty';
  empty.textContent = '該当する作品がありません。検索条件を変えてください。';
  empty.hidden = true;
  ui.append(empty);
  const jump = document.createElement('input');
  jump.type = 'range';
  jump.min = '0';
  jump.step = '1';
  jump.setAttribute('aria-label', '作品の位置を選ぶ');
  jump.className = 'wave-jump';
  qs('.wave-controls', ui).after(jump);
  const stage = qs('.wave-stage', ui),
    list = qs('.wave-list', ui);
  const caption = qs('.wave-caption', ui),
    controls = qs('.wave-controls', ui);
  let drag: { x: number; y: number; id: number } | null = null;
  let ids = works.map((_, i) => i),
    current = 0,
    listMode = false,
    suppressUntil = 0,
    venue = 'all',
    focused = false,
    hovered = -1;
  let rotation = 0,
    inStage = false,
    onScreen = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const centerTitle = document.createElement('div');
  centerTitle.className = 'orbit-title';
  centerTitle.setAttribute('aria-hidden', 'true');
  stage.append(centerTitle);
  const logoGuide = document.createElement('img');
  logoGuide.className = 'works-logo-guide';
  logoGuide.src = 'assets/concept/iiiex2026-logo.png';
  logoGuide.alt = '';
  stage.prepend(logoGuide);
  let logoPoints: { x: number; y: number }[] = [];
  let hoveredTile = -1;
  logoGuide
    .decode()
    .then(() => {
      const c = document.createElement('canvas');
      c.width = c.height = 180;
      const g = context2d(c, { willReadFrequently: true });
      g.drawImage(logoGuide, 0, 0, 180, 180);
      const data = g.getImageData(0, 0, 180, 180).data,
        candidates = [];
      for (let y = 0; y < 180; y += 3)
        for (let x = 0; x < 180; x += 3) {
          const k = (y * 180 + x) * 4;
          if (
            data[k + 3] > 100 &&
            data[k + 1] > data[k] * 1.2 &&
            data[k + 1] > 70
          )
            candidates.push({
              x: x / 180 - 0.5,
              y: y / 180 - 0.5,
              d: Infinity,
            });
        }
      if (!candidates.length) return;
      let next = candidates[Math.floor(candidates.length * 0.55)];
      for (let i = 0; i < 420; i++) {
        logoPoints.push({ x: next.x, y: next.y });
        let best = -1;
        for (const p of candidates) {
          p.d = Math.min(p.d, (p.x - next.x) ** 2 + (p.y - next.y) ** 2);
          if (p.d > best) {
            best = p.d;
          }
        }
        next = candidates.find((p) => p.d === best)!;
      }
      logoPoints.sort((a, b) => a.y - b.y || a.x - b.x);
      render();
    })
    .catch(() => {});
  const back = actionButton({
    label: '作品群へ戻る ↙',
    className: 'spatial-back',
  });
  back.onclick = () => {
    focused = false;
    render();
  };
  caption.prepend(back);
  const status = document.createElement('div');
  status.className = 'spatial-status';
  status.setAttribute('aria-live', 'polite');
  stage.before(status);
  qsa<HTMLButtonElement>('[data-venue]', ui).forEach((b) => {
    const count =
      b.dataset.venue === 'all'
        ? works.length
        : works.filter((work) => work.venue === b.dataset.venue).length;
    b.textContent =
      (b.dataset.venue === 'all'
        ? 'すべて'
        : '会場 ' + (b.dataset.venue === '0' ? 'A' : 'B')) +
      ' · ' +
      count;
  });
  stage.setAttribute(
    'aria-label',
    '作品の円環。ホバーでタイトル表示、クリックで作品詳細。左右キーで作品を移動',
  );
  const cards = works.map((w, i) => {
    const b = workCard(w, i, 'gallery');
    b.addEventListener('click', () => {
      if (performance.now() < suppressUntil) return;
      const n = ids.indexOf(i);
      if (n < 0) return;
      current = n;
      detail.open(i);
    });
    stage.append(b);
    b.addEventListener('pointerenter', () => {
      hovered = i;
      render();
    });
    b.addEventListener('pointerleave', () => {
      hovered = -1;
      render();
    });
    b.addEventListener('focus', () => {
      current = ids.indexOf(i);
      focused = true;
      render();
    });
    b.addEventListener('blur', () => {
      focused = false;
      render();
    });
    const item = workCard(w, i, 'list');
    item.onclick = () => {
      current = ids.indexOf(i);
      render();
      detail.open(i);
    };
    list.append(item);
    return b;
  });
  const tiles = Array.from({ length: 420 }, (_, i) => {
    const id = i % works.length,
      b = workCard(works[id], id, 'tile');
    b.tabIndex = i < works.length ? 0 : -1;
    const enter = () => {
      hoveredTile = i;
      hovered = id;
      render();
    };
    const leave = () => {
      if (hoveredTile === i) {
        hoveredTile = -1;
        hovered = -1;
        render();
      }
    };
    b.addEventListener('pointerenter', enter);
    b.addEventListener('pointerleave', leave);
    b.addEventListener('focus', enter);
    b.addEventListener('blur', leave);
    b.onclick = () => {
      if (performance.now() < suppressUntil) return;
      current = ids.indexOf(id);
      detail.open(id);
    };
    stage.append(b);
    return b;
  });
  let layoutStyles = getComputedStyle(stage);
  let compactWidth = designNumber(layoutStyles, '--gallery-compact-width');
  let logoWidth = designNumber(layoutStyles, '--gallery-logo-width');
  let logoHeight = designNumber(layoutStyles, '--gallery-logo-height');
  function refreshLayout() {
    layoutStyles = getComputedStyle(stage);
    compactWidth = designNumber(layoutStyles, '--gallery-compact-width');
    logoWidth = designNumber(layoutStyles, '--gallery-logo-width');
    logoHeight = designNumber(layoutStyles, '--gallery-logo-height');
    render();
  }
  function render() {
    const mobile = stage.clientWidth < compactWidth;
    const width = stage.clientWidth || 700,
      height = stage.clientHeight || 600;
    const logoMode = venue === 'all';
    stage.classList.toggle('logo-layout', logoMode);
    logoGuide.hidden = !logoMode;
    const logoSize = Math.min(width * logoWidth, height * logoHeight);
    stage.style.setProperty('--works-logo-size', logoSize + 'px');
    const positions = works.map((_, i) => {
      if (logoMode && logoPoints.length) {
        const p =
          logoPoints[Math.floor((i * logoPoints.length) / works.length)];
        return {
          x: p.x * logoSize,
          y: p.y * logoSize - height * 0.055,
          scale: (logoSize * 0.027) / 200,
          depth: i / works.length,
          tilt: 0,
        };
      }
      const n = Math.max(0, ids.indexOf(i)),
        count = Math.max(1, ids.length);
      const angle = (n / count) * Math.PI * 2 - Math.PI / 2 + rotation;
      const depth = (Math.sin(angle) + 1) / 2;
      const rx = width * (mobile ? 0.36 : 0.39),
        ry = height * 0.32;
      const x = Math.cos(angle) * rx;
      const size = Math.min(
        width * (count > 20 ? 0.095 : 0.145),
        height * (count > 20 ? 0.15 : 0.23),
      );
      return {
        x,
        y: Math.sin(angle) * ry - x * 0.17,
        scale: (size / 200) * (0.88 + depth * 0.2),
        depth,
        tilt: Math.cos(angle) * -12,
      };
    });
    tiles.forEach((b, i) => {
      const p = logoPoints[i],
        id = i % works.length,
        included = ids.includes(id);
      b.hidden = !p;
      if (!p) return;
      const size = Math.max(10, logoSize * 0.027) * (1 + (i % 5) * 0.06),
        active = hoveredTile === i && logoMode;
      const target = positions[id];
      const x = logoMode ? p.x * logoSize : target.x,
        y = logoMode ? p.y * logoSize - height * 0.055 : target.y;
      b.style.width = b.style.height = size + 'px';
      b.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px)`;
      b.style.opacity = logoMode && included ? '1' : '0';
      b.inert = !logoMode || !included;
      b.style.pointerEvents = logoMode && included ? 'auto' : 'none';
      b.setAttribute('aria-hidden', String(!logoMode || !included));
      qs<HTMLImageElement>('img', b).style.transform =
        `scale(${active ? Math.min(8, 150 / size) : 1})`;
      b.style.zIndex = active ? '60' : '2';
      b.classList.toggle('is-hovered', active);
    });
    cards.forEach((b, i) => {
      const n = ids.indexOf(i),
        chosen = focused && n === current,
        included = n >= 0;
      (list.children[i] as HTMLButtonElement).hidden = !included;
      b.hidden = false;
      b.inert = !included || logoMode;
      b.setAttribute('aria-hidden', String(!included || logoMode));
      b.style.pointerEvents = !included || logoMode ? 'none' : 'auto';
      b.classList.toggle('is-current', chosen);
      b.setAttribute(
        'aria-label',
        works[i].title + '・' + venueName(works[i]) + 'の詳細を開く',
      );
      b.removeAttribute('aria-pressed');
      b.removeAttribute('aria-current');
      const p = positions[i];
      let x = p.x,
        y = p.y,
        scale = p.scale;
      if (!included) {
        x += (works[i].venue === '0' ? -1 : 1) * width * 0.35;
        scale *= 0.4;
      }
      if (chosen || hovered === i) scale *= logoMode ? 2.15 : 1.16;
      b.style.transform = `translate(-50%,-50%) translate3d(${x}px,${y}px,0) perspective(900px) rotateY(${p.tilt}deg) rotateZ(${logoMode ? 0 : -4}deg) scale(${scale})`;
      b.style.zIndex = String(chosen ? 40 : Math.round(p.depth * 20) + 1);
      b.style.opacity = !included || logoMode ? '0' : '1';
      b.tabIndex = included && !logoMode ? 0 : -1;
    });
    const titleId =
      hovered >= 0 && ids.includes(hovered)
        ? hovered
        : focused
          ? ids[current]
          : undefined;
    const titleText = titleId === undefined ? '' : works[titleId].title;
    if (centerTitle.textContent !== titleText)
      centerTitle.textContent = titleText;
    centerTitle.classList.toggle('is-visible', !!titleText);
    const statusText =
      (venue === 'all' ? '全作品' : venue === '0' ? '会場 A' : '会場 B') +
      ' · ' +
      ids.length +
      '点';
    if (status.textContent !== statusText) status.textContent = statusText;
    const id = ids[current];
    qs('span', caption).textContent =
      id === undefined ? '' : venueName(works[id]);
    qs('h3', caption).textContent = id === undefined ? '' : works[id].title;
    qs('[role=status]', search).textContent =
      ids.length + ' / ' + works.length + ' 点';
    empty.hidden = ids.length > 0;
    jump.max = String(Math.max(0, ids.length - 1));
    jump.value = String(current);
    jump.hidden = true;
    qs('.wave-count', ui).textContent =
      String(current + 1).padStart(2, '0') +
      ' / ' +
      String(ids.length).padStart(2, '0');
    qs<HTMLButtonElement>('.wave-prev', ui).disabled = current === 0;
    qs<HTMLButtonElement>('.wave-next', ui).disabled =
      current === ids.length - 1;
    stage.hidden = listMode || !ids.length;
    caption.hidden = controls.hidden = true;
    list.hidden = !listMode || !ids.length;
  }
  function move(delta: number) {
    if (!ids.length) return;
    current = Math.max(0, Math.min(ids.length - 1, current + delta));
    (venue === 'all' ? tiles[ids[current]] : cards[ids[current]]).focus({
      preventScroll: true,
    });
  }
  qs<HTMLButtonElement>('.wave-prev', ui).onclick = () => move(-1);
  qs<HTMLButtonElement>('.wave-next', ui).onclick = () => move(1);
  qs<HTMLButtonElement>('.text-link', caption).onclick = () =>
    detail.open(ids[current]);
  function filter() {
    const previous = ids[current],
      q = qs<HTMLInputElement>('input', search)
        .value.trim()
        .toLocaleLowerCase();
    ids = works
      .map((_, i) => i)
      .filter(
        (i) =>
          (venue === 'all' || works[i].venue === venue) &&
          (!q ||
            [works[i].title, works[i].author, String(i + 1).padStart(2, '0')]
              .join(' ')
              .toLocaleLowerCase()
              .includes(q)),
      );
    current = Math.max(0, ids.indexOf(previous));
    focused = false;
    hovered = -1;
    hoveredTile = -1;
    render();
  }
  qs<HTMLInputElement>('input', search).addEventListener('input', filter);
  jump.oninput = () => {
    current = Number(jump.value);
    render();
  };
  qsa<HTMLButtonElement>('[data-venue]', ui).forEach(
    (b) =>
      (b.onclick = () => {
        venue = b.dataset.venue ?? 'all';
        qsa<HTMLButtonElement>('[data-venue]', ui).forEach((x) =>
          x.setAttribute('aria-pressed', String(x === b)),
        );
        filter();
      }),
  );
  const viewToggle = qs<HTMLButtonElement>('.wave-view', ui);
  viewToggle.onclick = () => {
    listMode = !listMode;
    viewToggle.setAttribute('aria-pressed', String(listMode));
    viewToggle.textContent = listMode ? '空間表示' : '一覧表示';
    render();
  };
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      focused = false;
      render();
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      move(e.key === 'ArrowRight' ? 1 : -1);
    }
  });
  stage.addEventListener('click', (e) => {
    if (e.target === stage) {
      focused = false;
      render();
    }
  });
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
  });
  stage.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('dragging');
    }
  });
  stage.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
      move(dx < 0 ? 1 : -1);
      suppressUntil = performance.now() + 350;
    }
    if (stage.hasPointerCapture(e.pointerId))
      stage.releasePointerCapture(e.pointerId);
    drag = null;
    stage.classList.remove('dragging');
  });
  stage.addEventListener('pointercancel', () => {
    drag = null;
    stage.classList.remove('dragging');
  });
  // Detail navigation and the gallery selection remain synchronized.
  detail.dialog.addEventListener('close', () => {
    const n = ids.indexOf(detail.selected);
    if (n >= 0) current = n;
    render();
  });
  const next = qs<HTMLButtonElement>('#next-work');
  function detailNext() {
    next.disabled = ids.indexOf(detail.selected) >= ids.length - 1;
  }
  new MutationObserver(detailNext).observe(qs('#detail-title'), {
    childList: true,
  });
  next.onclick = () => {
    const n = ids.indexOf(detail.selected);
    if (n >= 0 && n < ids.length - 1) {
      current = n + 1;
      render();
      detail.open(ids[current]);
      detailNext();
    }
  };
  new ResizeObserver(refreshLayout).observe(stage);
  render();
  stage.addEventListener('pointerenter', () => {
    inStage = true;
  });
  stage.addEventListener('pointerleave', () => {
    inStage = false;
    hovered = -1;
    render();
  });
  new IntersectionObserver((entries) => {
    onScreen = entries[0].isIntersecting;
  }).observe(stage);
  let previousTime = 0,
    speed = 0;
  function orbit(now: number) {
    const dt = Math.min((now - previousTime) / 1000 || 0, 0.05);
    previousTime = now;
    const running =
      venue !== 'all' &&
      onScreen &&
      !document.hidden &&
      !listMode &&
      !inStage &&
      !focused &&
      !detail.dialog.open &&
      !reduced.matches;
    speed += (Number(running) - speed) * Math.min(1, dt * 4);
    if (onScreen && !listMode && !reduced.matches && speed > 0.001) {
      rotation += (dt * speed * Math.PI * 2) / 240;
      render();
    }
    requestAnimationFrame(orbit);
  }
  requestAnimationFrame(orbit);
}
