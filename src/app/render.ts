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
import { populateNavigation } from '../components/navigation';
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
  populateNavigation(root);
}
