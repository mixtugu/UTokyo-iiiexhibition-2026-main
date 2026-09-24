import header from '../components/site-header.html?raw';
import footer from '../components/site-footer.html?raw';
import dialog from '../components/work-dialog.html?raw';
import hero from '../sections/top.html?raw';
import concept from '../sections/concept.html?raw';
import works from '../sections/works.html?raw';
import announce from '../sections/announce.html?raw';
import members from '../sections/members.html?raw';
import access from '../sections/access.html?raw';
import archives from '../sections/archives.html?raw';
import { navigation } from '../content/navigation';
import { sectionHeading } from '../components/section-heading';
import { fragment, qsa } from '../lib/dom';

export function renderApp(root: HTMLElement): void {
  root.replaceChildren(
    fragment(
      `${header}<main>${hero}${concept}${works}${announce}${members}${access}${archives}</main>${footer}${dialog}`,
    ),
  );
  for (const placeholder of qsa('[data-section-heading]', root)) {
    placeholder.replaceWith(
      sectionHeading(
        placeholder.dataset.sectionHeading!,
        placeholder.dataset.sectionNote,
      ),
    );
  }
  for (const container of qsa('[data-navigation]', root)) {
    for (const item of navigation.filter(
      (item) => container.dataset.navigation !== 'header' || item.header,
    )) {
      const link = document.createElement('a');
      link.href = `#${item.id}`;
      link.textContent = item.label;
      container.append(link);
    }
  }
}
