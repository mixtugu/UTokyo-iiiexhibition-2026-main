import type { Preview } from '@storybook/html-vite';
import '../src/styles/main.css';
import '../src/stories/catalog.css';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    viewport: {
      options: {
        phone: {
          name: 'Phone · 390px',
          styles: { width: '390px', height: '844px' },
        },
        tablet: {
          name: 'Tablet · 820px',
          styles: { width: '820px', height: '1180px' },
        },
        desktop: {
          name: 'Desktop · 1440px',
          styles: { width: '1440px', height: '900px' },
        },
      },
    },
    options: {
      storySort: { order: ['Design', 'Components', 'Layout', 'Sections'] },
    },
  },
};
export default preview;
