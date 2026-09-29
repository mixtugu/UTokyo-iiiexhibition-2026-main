import { expect, test } from '@playwright/test';

test('reference responsive layouts remain within the viewport', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute(
    'data-exhibition-ready',
    'true',
  );
  for (const width of [390, 600, 767, 768, 820, 1023, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `width ${width}`,
    ).toBe(true);
  }
});
