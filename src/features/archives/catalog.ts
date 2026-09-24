import { fallbackArchives, isArchiveCatalog } from '../../content/archives';
import { qs, qsa } from '../../lib/dom';
import type { Archive } from '../../types';

export function initArchives(): void {
  const stage = qs('.archive-stage');
  const links = qs('.archive-links', stage);
  const image = qs<SVGImageElement>('#archive-image', stage);
  const outline = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  outline.setAttribute('href', '#contour');
  qs('.contours', stage).append(outline);
  const clear = () => {
    stage.classList.remove('previewing');
    qsa('a', stage).forEach((link) => link.classList.remove('active'));
  };
  function populate(items: Archive[]): void {
    links.replaceChildren();
    links.classList.add('archive-catalog');
    for (const group of new Set(items.map((item) => item.group))) {
      const column = document.createElement('div');
      column.className = 'archive-column';
      const heading = document.createElement('h3');
      heading.textContent = group;
      column.append(heading);
      for (const item of items.filter((item) => item.group === group)) {
        const link = document.createElement('a');
        link.href = item.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.title = `${item.year} ${item.title}`;
        const year = document.createElement('small');
        year.textContent = item.year;
        const title = document.createElement('span');
        title.textContent = `${item.title} ↗`;
        link.append(year, title);
        const activate = () => {
          qsa('a', stage).forEach((other) =>
            other.classList.toggle('active', other === link),
          );
          stage.classList.toggle('previewing', Boolean(item.image));
          if (item.image) image.setAttribute('href', item.image);
          else image.removeAttribute('href');
        };
        link.addEventListener('pointerenter', activate);
        link.addEventListener('focus', activate);
        link.addEventListener('blur', clear);
        column.append(link);
      }
      links.append(column);
    }
  }
  populate(fallbackArchives);
  fetch('assets/archive/imported/catalog.json')
    .then(async (response) => {
      if (!response.ok) throw new Error('Archive catalog unavailable');
      const data: unknown = await response.json();
      if (!isArchiveCatalog(data)) throw new Error('Invalid archive catalog');
      populate(data);
    })
    .catch((error) => console.warn('Using fallback archives:', error));
  stage.addEventListener('pointerleave', clear);
}
