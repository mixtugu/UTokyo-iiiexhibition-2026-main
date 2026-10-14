import { expect, test } from '@playwright/test';

test('hero language choice persists through sections and dynamic works', async ({
  page,
}) => {
  await page.goto('/');
  const control = page.locator('body > .language-switch');
  await control.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.hero-ticket')).toBeHidden();
  await page.locator('#announce').scrollIntoViewIfNeeded();
  await expect(control).toBeHidden();
  await expect(page.locator('.event-updates-heading')).toHaveText(
    'Event updates',
  );
  await page.locator('[data-notice="event"]').click();
  await expect(page.locator('#notice-heading')).toHaveText(
    'UTokyo iii Exhibition 2026 Talk Event',
  );
  await expect(page.locator('dialog .language-switch')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.goto('/preview.html?prototype=works');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const filter = page
    .locator('[data-mobile-venue="invite"], [data-desktop-venue="invite"]')
    .filter({ visible: true })
    .first();
  await filter.click();
  await expect(
    page.locator('.works-desktop-grid:visible, .works-mobile-list:visible'),
  ).toContainText('Invited work (placeholder)');
  await page.goto('/');
  await control.getByRole('button', { name: 'JA', exact: true }).click();
  await expect(page.locator('.event-updates-heading')).toHaveText(
    'イベントのお知らせ',
  );
  await expect(page.locator('.hero-ticket')).toBeVisible();
});
