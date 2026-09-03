import { expect, test } from '@playwright/test';
import {
  LIVE_ENABLED,
  injectSupabaseSession,
  mintLiveUser,
} from './fixtures/live-session';

test.describe('Platform v2 portal live JWT browser smoke (#37)', () => {
  test.skip(!LIVE_ENABLED, 'ACONGM_SUPABASE_ACCESS_TOKEN is not set');

  test('shows authenticated header chrome', async ({ page, baseURL }) => {
    const live = await mintLiveUser();
    try {
      await injectSupabaseSession(page, live.session, baseURL ?? 'http://127.0.0.1:3311');
      await page.goto('/');
      const account = page.locator('.acongm-auth-menu button').first();
      await expect(account).toBeVisible({ timeout: 30_000 });
      await expect(account).toHaveAttribute(
        'title',
        /Quality Gate Live|qg-.*@acongm\.com/,
      );
      await expect(page.getByRole('button', { name: '登录' })).toHaveCount(0);
    } finally {
      await live.cleanup();
    }
  });
});
