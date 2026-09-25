import type { Meta, StoryObj } from '@storybook/html-vite';
import { workCard } from '../components/work-card';
import { createWorks } from '../content/works';

interface Args {
  title: string;
  venue: string;
  index: number;
  variant: 'gallery' | 'list' | 'tile';
  placeholder: boolean;
}
const works = createWorks();
const meta = {
  title: 'Components/Work card',
  tags: ['autodocs'],
  args: {
    title: 'Memory Landscapes',
    venue: '0',
    index: 0,
    variant: 'list',
    placeholder: false,
  },
  argTypes: {
    variant: { control: 'select', options: ['list', 'gallery', 'tile'] },
    venue: { control: 'select', options: ['0', '1'] },
  },
  render: ({ title, venue, index, variant, placeholder }) => {
    const host = document.createElement('div');
    host.id = 'works';
    const wrapper = document.createElement('div');
    wrapper.className = variant === 'list' ? 'wave-list' : 'sb-card-gallery';
    wrapper.append(
      workCard({ ...works[placeholder ? 2 : 0], title, venue }, index, variant),
    );
    host.append(wrapper);
    return host;
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const List: Story = {};
export const Gallery: Story = { args: { variant: 'gallery' } };
export const Tile: Story = { args: { variant: 'tile' } };
export const Placeholder: Story = {
  args: { placeholder: true, title: '仮作品 03', index: 2 },
};
export const LongTitle: Story = {
  args: {
    title: '長い作品タイトルが折り返される場合の表示と操作領域を確認します',
  },
};
