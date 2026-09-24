import type { Work } from '../types';

export const workNumber = (index: number): string =>
  String(index + 1).padStart(2, '0');
export const venueName = (work: Work): string =>
  `会場 ${work.venue === '0' ? 'A' : 'B'}`;

/** Gallery, list and logo tiles share one image/label construction path. */
export function workCard(
  work: Work,
  index: number,
  variant: 'gallery' | 'list' | 'tile',
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  const image = document.createElement('img');
  image.src = work.image;
  image.alt = variant === 'gallery' ? work.title : '';
  if (variant === 'list') image.loading = 'lazy';
  else image.draggable = false;
  button.append(image);
  if (variant === 'tile') {
    button.className = 'logo-tile';
    button.setAttribute('aria-label', `${work.title}の詳細を開く`);
  } else {
    const number = document.createElement('small');
    number.textContent = `${workNumber(index)} · ${venueName(work)}`;
    if (variant === 'list') {
      const label = document.createElement('span');
      label.append(number, document.createTextNode(work.title));
      button.append(label);
    } else {
      button.className = 'wave-card';
      button.append(number);
    }
  }
  return button;
}
