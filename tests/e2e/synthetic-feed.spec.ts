import { expect, test } from '@playwright/test';

test('built probe processes a synthetic dynamically inserted feed unit', async ({ page }) => {
  await page.setContent('<main role="main"><section role="feed" id="feed"></section></main>');
  await page.addScriptTag({ path: 'dist/content/probe.js' });

  await page.evaluate(() => {
    const article = document.createElement('div');
    article.setAttribute('role', 'article');
    article.setAttribute('aria-posinset', '1');

    const time = document.createElement('time');
    const button = document.createElement('button');
    button.setAttribute('role', 'button');
    const secret = document.createElement('span');
    secret.textContent = 'PRIVATE_SYNTHETIC_TEXT_MUST_NOT_APPEAR_IN_DEBUG';

    article.append(time, button, secret);
    document.querySelector('#feed')?.append(article);
  });

  await page.waitForFunction(() => {
    const host = document.querySelector<HTMLElement>('[data-m0-probe-host="true"]');
    return host?.shadowRoot?.textContent?.includes('TOP_LEVEL_FEED_UNIT') ?? false;
  });

  const debugText = await page.evaluate(() => {
    const host = document.querySelector<HTMLElement>('[data-m0-probe-host="true"]');
    return host?.shadowRoot?.textContent ?? '';
  });

  expect(debugText).toContain('TOP_LEVEL_FEED_UNIT');
  expect(debugText).not.toContain('PRIVATE_SYNTHETIC_TEXT_MUST_NOT_APPEAR_IN_DEBUG');
});
