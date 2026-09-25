import type { Meta, StoryObj } from '@storybook/html-vite';
import access from '../sections/access.html?raw';
import announce from '../sections/announce.html?raw';
import { fragment, qsa } from '../lib/dom';
import { sectionHeading } from '../components/section-heading';

interface Args {
  section: 'access' | 'announce';
}
const meta = {
  title: 'Sections/Content',
  parameters: { layout: 'fullscreen' },
  args: { section: 'access' },
  render: ({ section }) => {
    const host = document.createElement('div');
    host.append(fragment(section === 'access' ? access : announce));
    for (const placeholder of qsa('[data-section-heading]', host))
      placeholder.replaceWith(
        sectionHeading(
          placeholder.dataset.sectionHeading!,
          placeholder.dataset.sectionNote,
        ),
      );
    return host;
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const Access: Story = {};
export const Donation: Story = { args: { section: 'announce' } };
