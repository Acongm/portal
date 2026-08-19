import { expect, test } from '@playwright/test';
import {
  LIVE_ENABLED,
  injectSupabaseSession,
  mintLiveUser,
} from './fixtures/live-session';

test.describe('Platform v2 live JWT browser smoke (#37)', () => {
  test.skip(!LIVE_ENABLED, 'ACONGM_SUPABASE_ACCESS_TOKEN is not set');

  test('top bar shows the live account and keeps the chat FAB mounted', async ({
    page,
    baseURL,
  }) => {
    const live = await mintLiveUser();
    try {
      await injectSupabaseSession(page, live.session, baseURL ?? 'http://127.0.0.1:3311');
      await page.goto('/');

      await expect(
        page.getByRole('button', { name: /Quality Gate Live|qg-/ }),
      ).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole('button', { name: '登录' })).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: /AI 阅读助手|AI 助手/ }),
      ).toBeVisible();
    } finally {
      await live.cleanup();
    }
  });
});
