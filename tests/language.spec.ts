import { expect, test } from '@playwright/test';

test('hero language choice persists through sections and dynamic works', async ({
  page,
}) => {
  await page.goto('/');
  const control = page.locator('body > .language-switch');
  await control.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.hero-ticket')).toHaveAttribute(
    'src',
    'assets/top/reservation-ticket-en.webp',
  );
  await expect(page.locator('.hero-ticket')).toBeVisible();
  await page.locator('#announce').scrollIntoViewIfNeeded();
  await expect(control).toBeHidden();
  await expect(page.locator('.announce-fund')).toContainText(
    'Support the Creators Fund',
  );
  await expect(page.locator('.announce-talk, #announce-detail')).toHaveCount(0);
  await page.goto('/preview.html?prototype=works');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const filter = page
    .locator('[data-mobile-venue="invite"], [data-desktop-venue="invite"]')
    .filter({ visible: true })
    .first();
  await expect(filter).toHaveText('Invited Works');
  // Works are hidden until published; the notice carries the translation instead.
  await expect(page.locator('.works-upcoming')).toHaveText(
    'Works will be added progressively.',
  );
  await page.goto('/');
  await control.getByRole('button', { name: 'JA', exact: true }).click();
  await expect(page.locator('.hero-ticket')).toHaveAttribute(
    'src',
    'assets/top/reservation-ticket-ja.webp',
  );
  await expect(page.locator('.announce-fund')).toContainText(
    '基金ページを見る',
  );
  await expect(page.locator('.hero-ticket')).toBeVisible();
});
