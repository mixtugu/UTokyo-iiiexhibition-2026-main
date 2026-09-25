import type { Meta, StoryObj } from '@storybook/html-vite';
import { siteNavigation } from '../components/navigation';

interface Args {
  kind: 'header' | 'footer';
}
const meta = {
  title: 'Layout/Navigation',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { kind: 'header' },
  render: ({ kind }) => {
    const host = document.createElement('div');
    host.className = 'sb-navigation';
    host.append(siteNavigation(kind));
    return host;
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const Header: Story = {};
export const Footer: Story = { args: { kind: 'footer' } };
