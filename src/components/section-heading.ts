/** Shared Tailwind layout; section typography remains in the design styles. */
export function sectionHeading(label: string, note?: string): HTMLDivElement {
  const heading = document.createElement('div');
  heading.className = 'section-top flex items-center justify-between gap-5';
  const title = document.createElement('span');
  title.textContent = label;
  heading.append(title);
  if (note) {
    const subtitle = document.createElement('span');
    subtitle.textContent = note;
    heading.append(subtitle);
  }
  return heading;
}
