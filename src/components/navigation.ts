import header from './site-header.html?raw';
import footer from './site-footer.html?raw';
import { navigation } from '../content/navigation';
import { fragment, qsa } from '../lib/dom';

export function populateNavigation(root: ParentNode): void {
  for (const container of qsa('[data-navigation]', root)) {
    for (const item of navigation.filter(
      (item) =>
        container.getAttribute('data-navigation') !== 'header' || item.header,
    )) {
      const link = document.createElement('a');
      link.href = `#${item.id}`;
      link.textContent = item.label;
      container.append(link);
    }
  }
}

export function siteNavigation(kind: 'header' | 'footer'): DocumentFragment {
  const content = fragment(kind === 'header' ? header : footer);
  populateNavigation(content);
  return content;
}
