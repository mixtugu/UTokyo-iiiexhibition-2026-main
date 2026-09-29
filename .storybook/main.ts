import type { StorybookConfig } from '@storybook/html-vite';
import tailwindcss from '@tailwindcss/vite';

const config: StorybookConfig = {
  framework: {
    name: '@storybook/html-vite',
    options: { builder: { viteConfigPath: false } },
  },
  stories: ['../src/stories/**/*.stories.ts'],
  addons: ['@storybook/addon-docs'],
  staticDirs: ['../public'],
  core: { disableTelemetry: true },
  // Isolate the component catalog from the app's multi-page build and ports.
  async viteFinal(config) {
    config.plugins = [...(config.plugins ?? []), tailwindcss()];
    return config;
  },
};
export default config;
