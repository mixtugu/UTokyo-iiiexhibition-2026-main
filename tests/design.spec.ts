import { expect, test } from '@playwright/test';

test('shared design settings propagate to actual sections, text, controls and images', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() => {
    const style = document.documentElement.style;
    style.setProperty('--page-gutter', '32px');
    style.setProperty('--content-max-width', '640px');
    style.setProperty('--section-space', '80px');
    style.setProperty('--type-body', '20px');
    style.setProperty('--leading-body', '1.8');
    style.setProperty('--type-note', '18px');
    style.setProperty('--control-min-size', '64px');
    style.setProperty('--work-image-fit', 'cover');
    style.setProperty('--work-image-position', '25% 75%');
  });
  for (const selector of [
    '#works',
    '#access',
    '#announce',
    '#contents',
    'header',
  ]) {
    const info = await page.locator(selector).evaluate((el) => ({
      padding: parseFloat(getComputedStyle(el).paddingLeft),
      width: el.getBoundingClientRect().width,
    }));
    expect(info.padding).toBeCloseTo(Math.max(32, (info.width - 640) / 2), 0);
  }
  await expect(page.locator('#works')).toHaveCSS('padding-top', '80px');
  await expect(page.locator('.donation-panel p').first()).toHaveCSS(
    'font-size',
    '20px',
  );
  await expect(page.locator('.access-block p').first()).toHaveCSS(
    'line-height',
    '36px',
  );
  await expect(page.locator('.footer-small')).toHaveCSS('font-size', '18px');
  await expect(page.locator('.wave-view')).toHaveCSS('min-height', '64px');
  await expect(page.locator('.wave-list img').first()).toHaveCSS(
    'object-fit',
    'cover',
  );
  await expect(page.locator('.wave-list img').first()).toHaveCSS(
    'object-position',
    '25% 75%',
  );
});

test('responsive boundaries share a single theme and do not overflow', async ({
  page,
}) => {
  await page.goto('/');
  const breakpoint = await page.evaluate(() =>
    Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--breakpoint-tablet',
      ),
    ),
  );
  for (const width of [
    390,
    breakpoint - 1,
    breakpoint,
    820,
    1023,
    1024,
    1440,
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('header nav')).toHaveCSS(
      'display',
      width < breakpoint ? 'none' : 'flex',
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `width ${width}`,
    ).toBe(true);
  }
});
