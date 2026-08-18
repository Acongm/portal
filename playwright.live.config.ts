import { defineConfig, devices } from '@playwright/test';

const SUPABASE_URL = 'https://ejprvntpxlyydkzsjqnv.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqcHJ2bnRweGx5eWRrenNqcW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzAxNjYsImV4cCI6MjA5NjI0NjE2Nn0.a6E_WLbG-7Fv4JUzV1z7yYZH-zP89yD5AVWKV3XUSB8';

export default defineConfig({
  testDir: './e2e',
  testMatch: /live-quality-gate\.spec\.ts/,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 90_000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3320',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm --filter web exec next dev --port 3320',
    url: 'http://localhost:3320',
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      PORT: '3320',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3320',
      NEXT_PUBLIC_CHAT_URL: 'https://chat.acongm.com',
      NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
      NEXT_PUBLIC_AUTH_URL: 'https://auth.acongm.com',
      NEXT_PUBLIC_AUTH_LOCAL: '1',
      AI_CHATS_UPSTREAM_URL: 'https://api.acongm.com/api/chats',
      USER_API_UPSTREAM_URL: 'https://api.acongm.com/api/user',
    },
  },
});
