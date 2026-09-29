import markup from './page.html?raw';
import scripts from './scripts.json';

/** Mount the supplied exhibition without altering layout or classic scope. */
export function mountReference(root: HTMLElement): void {
  const template = document.createElement('template');
  template.innerHTML = markup;
  root.replaceWith(template.content);
  // These scripts share works/dialog state and must execute in source order.
  scripts.forEach((name, index) => {
    const script = document.createElement('script');
    script.src = `${import.meta.env.BASE_URL}reference-runtime/${name}`;
    script.async = false;
    if (index === scripts.length - 1) {
      script.onload = () => {
        document.documentElement.dataset.exhibitionReady = 'true';
      };
    }
    script.onerror = () =>
      console.error(`Failed to load exhibition script: ${name}`);
    document.body.append(script);
  });
}
