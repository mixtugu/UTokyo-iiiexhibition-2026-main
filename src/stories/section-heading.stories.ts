import type { Meta, StoryObj } from '@storybook/html-vite';
import { sectionHeading } from '../components/section-heading';

interface Args {
  label: string;
  note: string;
}
const meta = {
  title: 'Components/Section heading',
  tags: ['autodocs'],
  render: ({ label, note }) => sectionHeading(label, note || undefined),
  args: { label: '02 / WORKS', note: '' },
  parameters: {
    docs: {
      description: {
        component:
          'The shared section heading used on the site. Font size, line height, and spacing come from design/tokens.css.',
      },
    },
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const Default: Story = {};
export const WithNote: Story = {
  args: { label: '01 / CONCEPT', note: '東京大学 制作展 2026' },
};
export const LongText: Story = {
  args: {
    label: '制作展の長いセクション見出し',
    note: '補足説明が長くなった場合の確認用テキスト',
  },
};
