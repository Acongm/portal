import { expect, test } from '@playwright/test';
import { installQualityGateMocks } from './fixtures/mock-quality-gate';

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

  test('daily-news page mounts the docs assistant drawer', async ({ page }) => {
    await page.goto('/docs/news/daily-news/2026-08-18');
    await page.getByRole('button', { name: /AI 阅读助手|AI 助手/ }).click();
    await expect(page.getByRole('heading', { name: 'AI 阅读助手' })).toBeVisible();
    await expect(page.locator('.acongm-gpt-composer__input')).toBeEnabled({
      timeout: 30_000,
    });
    await expect(page.locator('.acongm-chat-rd .acongm-gpt-thread')).toBeVisible();
  });

  test('docs embed stays mounted and opens a typable composer', async ({
    page,
  }) => {
    await page.goto('/docs/core');

    const fab = page.getByRole('button', { name: /AI 阅读助手|AI 助手/ });
    await expect(fab).toBeVisible({ timeout: 30_000 });
    await fab.click();

    await expect(page.getByRole('heading', { name: 'AI 阅读助手' })).toBeVisible();

    const composer = page.locator('.acongm-gpt-composer__input');
    await expect(composer).toBeVisible();
    await expect(composer).toBeEnabled();
    await expect(composer).toHaveAttribute(
      'placeholder',
      /有什么可以帮忙的|正在准备安全会话/,
    );
  });

  test('docs drawer can send a message and render the streamed reply', async ({
    page,
  }) => {
    await page.goto('/docs/core');

    await page.getByRole('button', { name: /AI 阅读助手|AI 助手/ }).click();
    const composer = page.locator('.acongm-gpt-composer__input');
    await expect(composer).toBeEnabled({ timeout: 30_000 });

    await composer.fill('hello quality gate');
    await page.getByTitle('发送').click();

    await expect(page.getByText('你好，这是测试回复')).toBeVisible({
      timeout: 30_000,
    });
  });

  test('docs drawer hides empty reasoning panel when model returns no thinking', async ({
    page,
  }) => {
    await page.goto('/docs/golang/daily-golang/lesson-01');

    await page.getByRole('button', { name: /AI 阅读助手|AI 助手/ }).click();
    const composer = page.locator('.acongm-gpt-composer__input');
    await expect(composer).toBeEnabled({ timeout: 30_000 });

    await composer.fill('如何理解这里的 fmt');
    await page.getByTitle('发送').click();

    await expect(page.getByText('你好，这是测试回复')).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByText('模型未返回推理内容'),
    ).toHaveCount(0);
    await expect(page.getByRole('button', { name: '思考过程' })).toHaveCount(0);

    if (process.env.WALKTHROUGH_ARTIFACTS) {
      await page.screenshot({
        path: '/opt/cursor/artifacts/screenshots/portal-chat-no-thinking-fix.png',
      });
    }
  });

  test('daily-news long replies show drawer chrome at rest', async ({
    page,
  }) => {
    await installQualityGateMocks(page, { longFirstReply: true });
    await page.goto('/docs/news/daily-news/2026-08-18');
    await page.getByRole('button', { name: /AI 阅读助手|AI 助手/ }).click();
    const composerInput = page.locator('.acongm-gpt-composer__input');
    await expect(composerInput).toBeEnabled({ timeout: 30_000 });
    await composerInput.fill('继续');
    await page.getByTitle('发送').click();
    const viewport = page.locator('.acongm-gpt-thread__viewport');
    await expect(page.locator('.acongm-gpt-msg.is-user')).toContainText('继续', {
      timeout: 30_000,
    });
    await expect(viewport).toContainText('这是第 1 段长回复');
    await expect(
      page.locator('.acongm-gpt-thread__viewport .acongm-gpt-thread__footer'),
    ).toHaveCount(0);
    await expect(
      page.locator('.acongm-gpt-thread__footer .acongm-gpt-composer'),
    ).toBeVisible();

    const metrics = await page.evaluate(() => {
      const drawer = document.querySelector('.acongm-chat-rd .rc-drawer-content');
      const thread = document.querySelector('.acongm-chat-rd .acongm-gpt-thread');
      const viewport = document.querySelector('.acongm-gpt-thread__viewport');
      const composer = document.querySelector(
        '.acongm-gpt-thread__footer .acongm-gpt-composer',
      );
      const header = document.querySelector('.acongm-chat-shell__header');
      const composerBox = composer?.getBoundingClientRect();
      const headerBox = header?.getBoundingClientRect();
      const drawerBox = drawer?.getBoundingClientRect();
      return {
        drawerHeight: drawerBox?.height ?? 0,
        threadHeight: thread?.getBoundingClientRect().height ?? 0,
        viewportHeight: viewport?.getBoundingClientRect().height ?? 0,
        viewportScrollHeight: viewport?.scrollHeight ?? 0,
        windowHeight: window.innerHeight,
        composerVisible: Boolean(
          composerBox &&
            composerBox.top >= 0 &&
            composerBox.bottom <= window.innerHeight + 1,
        ),
        headerVisible: Boolean(
          headerBox &&
            headerBox.top >= 0 &&
            headerBox.bottom <= window.innerHeight + 1,
        ),
      };
    });

    expect(metrics.drawerHeight).toBeGreaterThan(200);
    expect(metrics.drawerHeight).toBeLessThanOrEqual(metrics.windowHeight + 1);
    expect(metrics.threadHeight).toBeLessThanOrEqual(metrics.drawerHeight + 1);
    expect(metrics.viewportHeight).toBeGreaterThan(80);
    expect(metrics.viewportScrollHeight).toBeGreaterThan(
      metrics.viewportHeight + 200,
    );
    expect(metrics.composerVisible).toBe(true);
    expect(metrics.headerVisible).toBe(true);

    await page.screenshot({
      path: '/opt/cursor/artifacts/portal_long_drawer_rest_no_scroll.png',
      animations: 'disabled',
    });
  });

  test('docs drawer scrolls only the viewport and keeps the composer pinned', async ({
    page,
  }) => {
    await page.goto('/docs/core');
    await page.getByRole('button', { name: /AI 阅读助手|AI 助手/ }).click();
    const composerInput = page.locator('.acongm-gpt-composer__input');
    await expect(composerInput).toBeEnabled({ timeout: 30_000 });
    await composerInput.fill('hello quality gate');
    await page.getByTitle('发送').click();
    await expect(page.getByText('你好，这是测试回复')).toBeVisible({
      timeout: 30_000,
    });

    const viewport = page.locator('.acongm-gpt-thread__viewport');
    const composer = page.locator(
      '.acongm-gpt-thread__footer .acongm-gpt-composer',
    );
    await expect(
      page.locator('.acongm-gpt-thread__viewport .acongm-gpt-thread__footer'),
    ).toHaveCount(0);

    await viewport.evaluate((node) => {
      const spacer = document.createElement('div');
      spacer.dataset.scrollProbe = '1';
      spacer.style.height = '1600px';
      spacer.style.flexShrink = '0';
      node.prepend(spacer);
    });

    const before = await composer.boundingBox();
    expect(before).toBeTruthy();
    await viewport.evaluate((node) => {
      node.scrollTop = 900;
    });
    const after = await composer.boundingBox();
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThan(2);
    expect(await viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(
      100,
    );
  });

  test('docs account menu stays fully visible when opened from the sidebar footer', async ({
    page,
  }) => {
    await installQualityGateMocks(page, { authenticatedUser: true });
    await page.goto('/docs/core');

    const trigger = page.locator('.acongm-auth-menu button');
    await expect(trigger).toBeVisible({ timeout: 30_000 });
    await trigger.click();

    const panel = page.getByRole('menu', { name: '账号菜单' });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('menuitem', { name: '退出登录' })).toBeVisible();

    const box = await panel.boundingBox();
    const viewport = page.viewportSize();
    expect(box).toBeTruthy();
    expect(viewport).toBeTruthy();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual((viewport?.height ?? 0) + 1);
    expect(box!.x + box!.width).toBeLessThanOrEqual((viewport?.width ?? 0) + 1);

    await page.screenshot({
      path: '/opt/cursor/artifacts/docs_account_menu_in_viewport.png',
      animations: 'disabled',
    });
  });

  test('docs knowledge picker opens above the composer and stays in view', async ({
    page,
  }) => {
    await page.goto('/docs/core');
    await page.getByRole('button', { name: /AI 阅读助手|AI 助手/ }).click();
    await expect(page.locator('.acongm-gpt-composer__input')).toBeEnabled({
      timeout: 30_000,
    });

    await page.getByRole('button', { name: '添加知识' }).click();
    const menu = page.getByRole('listbox', { name: '关联知识' });
    await expect(menu).toBeVisible();

    const menuBox = await menu.boundingBox();
    const composerBox = await page.locator('.acongm-gpt-composer').boundingBox();
    const viewport = page.viewportSize();
    expect(menuBox).toBeTruthy();
    expect(composerBox).toBeTruthy();
    expect(viewport).toBeTruthy();
    expect(menuBox!.y).toBeGreaterThanOrEqual(0);
    expect(menuBox!.x).toBeGreaterThanOrEqual(0);
    expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(
      (viewport?.height ?? 0) + 1,
    );
    expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(
      (viewport?.width ?? 0) + 1,
    );
    expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(
      (composerBox?.y ?? 0) + 12,
    );

    await page.screenshot({
      path: '/opt/cursor/artifacts/docs_knowledge_picker_above_composer.png',
      animations: 'disabled',
    });
  });

  test('docs drawer shows an error instead of an empty bubble when the model returns no text', async ({
    page,
  }) => {
    await installQualityGateMocks(page, { emptyFirstReply: true });
    await page.goto('/docs/core');
    await page.getByRole('button', { name: /AI 阅读助手|AI 助手/ }).click();
    const composer = page.locator('.acongm-gpt-composer__input');
    await expect(composer).toBeEnabled({ timeout: 30_000 });
    await composer.fill('hello quality gate');
    await page.getByTitle('发送').click();

    await expect(page.locator('.acongm-gpt-msg__error')).toContainText(
      '模型没有返回内容，请重试。',
      { timeout: 30_000 },
    );
    await expect(page.getByText('你好，这是测试回复')).toHaveCount(0);

    await page.screenshot({
      path: '/opt/cursor/artifacts/docs_empty_send_error.png',
      animations: 'disabled',
    });
  });

  test('docs drawer surfaces stream HTTP errors in the assistant bubble', async ({
    page,
  }) => {
    await installQualityGateMocks(page, {
      streamHttpError: {
        status: 400,
        message: 'context.content must be shorter than 12000 characters',
      },
    });
    await page.goto('/docs/core');
    await page.getByRole('button', { name: /AI 阅读助手|AI 助手/ }).click();
    const composer = page.locator('.acongm-gpt-composer__input');
    await expect(composer).toBeEnabled({ timeout: 30_000 });
    await composer.fill('hello quality gate');
    await page.getByTitle('发送').click();

    await expect(page.locator('.acongm-gpt-msg__error')).toContainText(
      'context.content must be shorter than 12000 characters',
      { timeout: 30_000 },
    );
  });
});
