import type { Meta, StoryObj } from '@storybook/html-vite';
import { actionButton } from '../components/action';

interface Args {
  label: string;
  disabled: boolean;
}
const meta = {
  title: 'Components/Action',
  tags: ['autodocs'],
  args: { label: '作品を見る ↗', disabled: false },
  render: (args) => actionButton(args),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const LongLabel: Story = {
  args: { label: '東京大学制作展クリエイターズ基金について ↗' },
};
