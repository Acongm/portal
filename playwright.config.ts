import { defineConfig, devices } from '@playwright/test';

const MOCK_SUPABASE_URL = 'http://mock-supabase.test';
const MOCK_ANON_KEY = 'mock-anon-key';

export default defineConfig({
  testDir: './e2e',
  testIgnore: /live-quality-gate\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:3310',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm --filter web exec next dev --port 3310',
    url: 'http://localhost:3310',
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      PORT: '3310',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3310',
      NEXT_PUBLIC_CHAT_URL: 'https://chat.acongm.com',
      NEXT_PUBLIC_SUPABASE_URL: MOCK_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: MOCK_ANON_KEY,
      NEXT_PUBLIC_AUTH_URL: 'https://auth.acongm.com',
      AI_CHATS_UPSTREAM_URL: 'http://localhost:3310/api/chats',
      USER_API_UPSTREAM_URL: 'http://localhost:3310/api/user',
      AUTH_SESSION_URL: 'http://localhost:3310/api/auth/session',
    },
  },
});
