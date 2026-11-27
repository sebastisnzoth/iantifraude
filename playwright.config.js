import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  use: {
    baseURL: 'http://127.0.0.1:8133',
    launchOptions: { executablePath: process.env.CHROMIUM_BIN || undefined },
  },
  webServer: {
    command: 'python3 -m http.server 8133 --bind 127.0.0.1',
    url: 'http://127.0.0.1:8133',
  },
});
