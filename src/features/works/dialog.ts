import type { Work } from '../../types';
import { qs } from '../../lib/dom';

export interface WorkDialog {
  readonly dialog: HTMLDialogElement;
  readonly selected: number;
  open(index: number): void;
}

export function createWorkDialog(
  works: readonly Work[],
  root: ParentNode = document,
): WorkDialog {
  const dialog = qs<HTMLDialogElement>('#detail', root);
  const image = qs<HTMLImageElement>('#detail-image', dialog);
  const title = qs('#detail-title', dialog);
  const number = qs('#detail-number', dialog);
  const description = qs('#detail-description', dialog);
  const note = qs('.draft-note', dialog);
  let selected = 0;
  let lastFocus: HTMLElement | null = null;
  qs<HTMLButtonElement>('.close-detail', dialog).onclick = () => dialog.close();
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      dialog.close();
  });
  dialog.addEventListener('close', () => lastFocus?.focus());
  return {
    dialog,
    get selected() {
      return selected;
    },
    open(index) {
      const work = works[index];
      if (!work) return;
      selected = index;
      image.src = work.image;
      image.alt = work.title;
      title.textContent = work.title;
      number.textContent = `WORK / ${String(index + 1).padStart(2, '0')}`;
      description.textContent = work.description;
      note.textContent = work.placeholder
        ? '未提供作品の仮枠です。正式な作品ではありません。'
        : '画像・作品情報は試作用です。会場分類は仮です。';
      if (!dialog.open) {
        lastFocus =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        dialog.showModal();
      }
    },
  };
}
