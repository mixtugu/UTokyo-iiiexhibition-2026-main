import './styles/main.css';
import { renderApp } from './app/render';
import { createWorks } from './content/works';
import { qs } from './lib/dom';
import { createWorkDialog } from './features/works/dialog';
import { initWorksGallery } from './features/works/gallery';
import { initArchives } from './features/archives/catalog';
import { initMemberTransition } from './features/members/transition';
import { initConceptStory } from './features/concept/story';
import { initSmoothScroll } from './features/scroll/smooth-scroll';
import { initHeroParticles } from './features/hero/particles';
import { initConceptLiquid } from './features/concept/liquid';

renderApp(qs('#app'));
const works = createWorks();
initWorksGallery(works, createWorkDialog(works));
initArchives();
initMemberTransition();
initConceptStory();
initSmoothScroll();
// The liquid background attaches to the pin created by the hero initializer.
initHeroParticles();
initConceptLiquid();
