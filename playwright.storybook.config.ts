import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/storybook',
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:6007', trace: 'retain-on-failure' },
  webServer: {
    command:
      'npx vite preview --outDir storybook-static --host 127.0.0.1 --port 6007',
    url: 'http://127.0.0.1:6007',
    reuseExistingServer: false,
  },
});
