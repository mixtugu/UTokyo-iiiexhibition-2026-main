import type { Meta, StoryObj } from '@storybook/html-vite';
import { createWorkDialog } from '../features/works/dialog';
import { createWorks } from '../content/works';
import { actionButton } from '../components/action';
import { fragment, qs } from '../lib/dom';
import markup from '../components/work-dialog.html?raw';

interface Args {
  placeholder: boolean;
}
const meta = {
  title: 'Components/Work dialog',
  tags: ['autodocs'],
  args: { placeholder: false },
  render: ({ placeholder }) => {
    const host = document.createElement('div');
    host.append(fragment(markup));
    const works = createWorks();
    const detail = createWorkDialog(works, host);
    const next = qs<HTMLButtonElement>('#next-work', host);
    const open = (index: number) => {
      detail.open(index);
      next.disabled = index === works.length - 1;
    };
    next.onclick = () => open(detail.selected + 1);
    host.prepend(
      actionButton({
        label: '作品詳細を開く',
        onClick: () => open(placeholder ? 29 : 0),
      }),
    );
    return host;
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const Default: Story = {};
export const Placeholder: Story = { args: { placeholder: true } };
