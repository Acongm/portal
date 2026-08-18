import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  FIRST_ASSISTANT_REPLY,
  RELOADED_ASSISTANT_REPLY,
  installQualityGateMocks,
} from './fixtures/mock-quality-gate';

async function openDocsAssistant(page: Page): Promise<Locator> {
  await page.goto('/docs/core');

  const fab = page.getByRole('button', { name: /AI 阅读助手|AI 助手/ });
  await expect(fab).toBeVisible({ timeout: 30_000 });
  await fab.click();
  await expect(page.getByRole('heading', { name: 'AI 阅读助手' })).toBeVisible();

  const composer = page.locator('.acongm-gpt-composer__input');
  await expect(composer).toBeVisible();
  return composer;
}

test.describe('Platform v2 quality gate browser smoke (#37)', () => {
  test.beforeEach(async ({ page }) => {
    await installQualityGateMocks(page);
  });

  test('home chrome keeps Chat and login controls visible', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: '打开 Chat' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible();
  });

  test('docs embed stays mounted and opens a typable composer', async ({
    page,
  }) => {
    const composer = await openDocsAssistant(page);
    await expect(composer).toBeEnabled();
    await expect(composer).toHaveAttribute(
      'placeholder',
      /有什么可以帮忙的|正在准备安全会话/,
    );
  });

  test('docs drawer can send a message and render the streamed reply', async ({
    page,
  }) => {
    const composer = await openDocsAssistant(page);
    await expect(composer).toBeEnabled({ timeout: 30_000 });

    await composer.fill('hello quality gate');
    await page.getByTitle('发送').click();

    await expect(page.getByText(FIRST_ASSISTANT_REPLY)).toBeVisible({
      timeout: 30_000,
    });
  });

  test('docs drawer restores the durable transcript after reload', async ({
    page,
  }) => {
    const composer = await openDocsAssistant(page);
    await expect(composer).toBeEnabled({ timeout: 30_000 });
    await composer.fill('hello quality gate');
    await page.getByTitle('发送').click();
    await expect(page.getByText(FIRST_ASSISTANT_REPLY)).toBeVisible({
      timeout: 30_000,
    });

    await page.reload();
    const restored = await openDocsAssistant(page);
    await expect(restored).toBeEnabled({ timeout: 30_000 });
    await expect(page.getByText(FIRST_ASSISTANT_REPLY)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('hello quality gate').first()).toBeVisible();
  });

  test('docs drawer can reload and edit after a streamed reply', async ({
    page,
  }) => {
    const composer = await openDocsAssistant(page);
    await expect(composer).toBeEnabled({ timeout: 30_000 });
    await composer.fill('trigger assistant actions');
    await page.getByTitle('发送').click();
    await expect(page.getByText(FIRST_ASSISTANT_REPLY)).toBeVisible({
      timeout: 30_000,
    });

    await page.getByTitle('重新生成').last().click();
    await expect(page.getByText(RELOADED_ASSISTANT_REPLY)).toBeVisible({
      timeout: 30_000,
    });

    const userBubble = page.locator('.acongm-gpt-msg.is-user').first();
    await userBubble.hover();
    await page.getByTitle('编辑').click();
    await page.locator('.acongm-gpt-edit__input').fill('edited portal prompt');
    await page.locator('.acongm-gpt-edit__send').click();
    await expect(page.getByText('edited portal prompt')).toBeVisible({
      timeout: 30_000,
    });
  });
});
