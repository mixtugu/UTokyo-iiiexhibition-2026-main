import type { Meta, StoryObj } from '@storybook/html-vite';

interface Args {
  view: 'full' | 'works' | 'announce' | 'members-archives';
}
const meta = {
  title: 'Reference/Exhibition',
  parameters: { layout: 'fullscreen' },
  args: { view: 'full' },
  argTypes: {
    view: {
      control: 'select',
      options: ['full', 'works', 'announce', 'members-archives'],
    },
  },
  render: ({ view }) => {
    const frame = document.createElement('iframe');
    frame.title = 'Reference exhibition';
    frame.src = `./reference-preview.html${view === 'full' ? '' : `?prototype=${view}`}`;
    frame.style.cssText =
      'display:block;width:100%;height:100vh;border:0;background:white';
    frame.addEventListener('load', () => {
      // Keep review navigation inside the standalone Storybook entry.
      frame.contentDocument
        ?.querySelectorAll<HTMLAnchorElement>('.prototype-review-bar a')
        .forEach((link) => {
          link.setAttribute(
            'href',
            link
              .getAttribute('href')!
              .replace('preview.html', 'reference-preview.html'),
          );
        });
    });
    return frame;
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const FullSite: Story = {};
export const Works: Story = { args: { view: 'works' } };
export const Announce: Story = { args: { view: 'announce' } };
export const MembersArchives: Story = { args: { view: 'members-archives' } };
