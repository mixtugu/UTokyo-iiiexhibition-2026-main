// Ease the actual document scroll so sticky backgrounds and particle effects
// all follow the same position. Touch and keyboard keep native behavior.
export function initSmoothScroll() {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(any-pointer: fine)');
  const RESPONSE_MS = 170;
  let target = scrollY;
  let position = scrollY;
  let written = scrollY;
  let previousTime = 0;
  let frameId = 0;
  const limit = () =>
    Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const bound = (value: number) => Math.max(0, Math.min(limit(), value));

  function cancel() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    target = position = written = scrollY;
  }

  function frame(time: number) {
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
    window.scrollTo({ top: position, left: scrollX, behavior: 'instant' });
    written = scrollY;
    if (done) {
      frameId = 0;
      target = position = written;
    } else {
      frameId = requestAnimationFrame(frame);
    }
  }

  function nativeArea(event: WheelEvent) {
    for (const node of event.composedPath()) {
      if (!(node instanceof Element)) continue;
      if (node === document.body || node === document.documentElement) break;
      if (
        node.matches(
          'dialog, input, textarea, select, [contenteditable], [data-native-scroll]',
        )
      )
        return true;
      const overflow = getComputedStyle(node).overflowY;
      if (
        /(auto|scroll|overlay)/.test(overflow) &&
        node.scrollHeight > node.clientHeight + 1
      )
        return true;
    }
    return false;
  }

  addEventListener(
    'wheel',
    (event) => {
      if (
        event.defaultPrevented ||
        !event.cancelable ||
        reducedMotion.matches ||
        !finePointer.matches ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
        !event.deltaY ||
        document.querySelector('dialog[open]') ||
        nativeArea(event)
      ) {
        cancel();
        return;
      }
      const unit =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
      const delta = event.deltaY * unit;
      if (!frameId) position = target = written = scrollY;
      // Reversing direction responds immediately, without paying off old momentum.
      if ((target - position) * delta < 0) target = position;
      target = bound(
        Math.max(
          position - innerHeight * 1.5,
          Math.min(position + innerHeight * 1.5, target + delta),
        ),
      );
      event.preventDefault();
      if (!frameId && Math.abs(target - position) > 0.4) {
        previousTime = performance.now();
        frameId = requestAnimationFrame(frame);
      }
    },
    { passive: false },
  );

  // Yield immediately to links, focus, scrollbar dragging, and native gestures.
  addEventListener('pointerdown', cancel, { passive: true });
  addEventListener('touchstart', cancel, { passive: true });
  addEventListener('keydown', cancel);
  addEventListener('click', cancel, { capture: true });
  addEventListener('focusin', cancel);
  addEventListener('hashchange', cancel);
  addEventListener('popstate', cancel);
  addEventListener('resize', cancel);
  addEventListener(
    'scroll',
    () => {
      if (!frameId || Math.abs(scrollY - written) > 2) cancel();
    },
    { passive: true },
  );
  document.addEventListener('visibilitychange', cancel);
  reducedMotion.addEventListener('change', cancel);
  finePointer.addEventListener('change', cancel);
}
