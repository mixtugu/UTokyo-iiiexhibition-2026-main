import { qs } from '../../lib/dom';
export function initConceptStory() {
  const story = qs('#concept');
  const storyReduced = matchMedia('(prefers-reduced-motion: reduce)');
  let storyPending = false;
  function updateStory() {
    storyPending = false;
    const pin = qs('.concept-visual', story);
    const progress = Math.max(
      0,
      Math.min(
        1,
        -story.getBoundingClientRect().top /
          Math.max(1, story.offsetHeight - pin.offsetHeight),
      ),
    );
    const visual = qs('div', pin);
    story.style.setProperty(
      '--story-mask',
      storyReduced.matches
        ? '0px'
        : (-progress * 35 * visual.clientWidth) / 1600 + 'px',
    );
  }
  function queueStory() {
    if (!storyPending) {
      storyPending = true;
      requestAnimationFrame(updateStory);
    }
  }
  addEventListener('scroll', queueStory, { passive: true });
  addEventListener('resize', queueStory);
  addEventListener('load', queueStory);
  storyReduced.addEventListener('change', queueStory);
  queueStory();
}
