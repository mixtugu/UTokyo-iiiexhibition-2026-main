import type { Meta, StoryObj } from '@storybook/html-vite';
import { sectionHeading } from '../components/section-heading';
import { workCard } from '../components/work-card';
import { actionButton } from '../components/action';
import { createWorks } from '../content/works';
import { fragment } from '../lib/dom';

interface Args {
  override: boolean;
  spacingUnit: number;
  gutter: number;
  contentWidth: number;
  sectionSpace: number;
  headingSize: number;
  bodySize: number;
  noteSize: number;
  bodyLeading: number;
  targetSize: number;
  imageFit: 'contain' | 'cover';
  imagePosition: string;
}
const meta = {
  title: 'Design/Tokens',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Defaults come from tokens.css. Enable override to make temporary changes in Controls. Changes apply only to this preview and are not saved. Update src/design/tokens.css with your chosen values. Use the Viewport tool to compare phone, tablet, and desktop layouts.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    override: false,
    spacingUnit: 8,
    gutter: 32,
    contentWidth: 1280,
    sectionSpace: 64,
    headingSize: 24,
    bodySize: 17,
    noteSize: 14,
    bodyLeading: 2,
    targetSize: 48,
    imageFit: 'contain',
    imagePosition: '50% 50%',
  },
  argTypes: {
    spacingUnit: { control: { type: 'range', min: 4, max: 16, step: 4 } },
    gutter: { control: { type: 'range', min: 8, max: 160, step: 8 } },
    contentWidth: { control: { type: 'range', min: 320, max: 1600, step: 8 } },
    sectionSpace: { control: { type: 'range', min: 16, max: 160, step: 8 } },
    targetSize: { control: { type: 'range', min: 40, max: 80, step: 8 } },
    imageFit: { control: 'select', options: ['contain', 'cover'] },
  },
  render: (args) => {
    const host = document.createElement('div');
    host.className = 'sb-foundation';
    // Define derived tokens locally too so custom properties recompute from local Controls.
    if (args.override) {
      const values = {
        '--space-unit': `${args.spacingUnit}px`,
        '--page-gutter': `${args.gutter}px`,
        '--content-max-width': `${args.contentWidth}px`,
        '--section-space': `${args.sectionSpace}px`,
        '--type-heading': `${args.headingSize}px`,
        '--type-body': `${args.bodySize}px`,
        '--type-note': `${args.noteSize}px`,
        '--leading-body': String(args.bodyLeading),
        '--control-min-size': `${args.targetSize}px`,
        '--work-image-fit': args.imageFit,
        '--work-image-position': args.imagePosition,
        '--content-inset':
          'max(var(--page-gutter), (100% - var(--content-max-width)) / 2)',
        '--grid-gap': 'var(--space-3)',
        '--content-gap': 'var(--space-5)',
        '--heading-gap': 'var(--space-4)',
        '--control-padding-block': 'var(--space-1)',
        '--control-padding-inline': 'var(--space-2)',
      };
      for (const [name, value] of Object.entries(values))
        host.style.setProperty(name, value);
      for (const n of [1, 2, 3, 4, 5, 6, 8, 10, 12])
        host.style.setProperty(
          `--space-${n}`,
          `calc(var(--space-unit) * ${n})`,
        );
    }
    host.append(sectionHeading('DESIGN / TOKENS', '8px grid'));
    host.append(
      fragment(
        '<h1 class="sb-title">Between perspectives</h1><h2>見出し / Heading</h2><p class="sb-copy">余白、本文のサイズと行間、作品画像の見え方を共通設定から調整できます。<br>Components that share these settings update together.</p><p class="sb-note">注釈 / Caption — Values are provisional.</p>',
      ),
    );
    const scale = document.createElement('div');
    scale.className = 'sb-scale';
    for (const n of [1, 2, 3, 4, 6, 8]) {
      const figure = document.createElement('figure');
      const bar = document.createElement('i');
      bar.style.width = `var(--space-${n})`;
      const label = document.createElement('figcaption');
      label.textContent = `space-${n}`;
      figure.append(bar, label);
      scale.append(figure);
    }
    const actions = document.createElement('div');
    actions.className = 'sb-actions';
    actions.append(
      actionButton({ label: '作品を見る ↗' }),
      actionButton({ label: '準備中', disabled: true }),
    );
    const works = document.createElement('div');
    works.id = 'works';
    const list = document.createElement('div');
    list.className = 'wave-list';
    createWorks()
      .slice(0, 2)
      .forEach((work, index) => list.append(workCard(work, index, 'list')));
    works.append(list);
    host.append(scale, actions, works);
    return host;
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const Playground: Story = {};
export const Spacious: Story = {
  args: {
    override: true,
    gutter: 64,
    contentWidth: 960,
    sectionSpace: 96,
    bodySize: 20,
    targetSize: 56,
  },
};
