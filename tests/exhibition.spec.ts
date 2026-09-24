import { expect, test } from '@playwright/test';

test('loads all sections, artwork and archive records without runtime or local asset errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (
      response.url().startsWith('http://127.0.0.1:4325') &&
      response.status() >= 400
    )
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('/');
  await expect(page.locator('.hero')).toHaveClass(/has-particle-logo/);
  await expect(page.locator('.wave-list button')).toHaveCount(30);
  await expect(page.locator('.archive-links a')).toHaveCount(29);
  await expect(page.locator('.logo-tile:not([hidden])')).toHaveCount(420);
  for (const id of [
    'top',
    'concept',
    'works',
    'announce',
    'access',
    'members',
    'archives',
  ]) {
    await expect(page.locator(`section#${id}`)).toHaveCount(1);
  }
  await page.locator('footer').scrollIntoViewIfNeeded();
  // Hidden list images are lazy; explicitly decode each source to validate the asset.
  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images)
        .filter((image) => image.getAttribute('src'))
        .map((image) => {
          image.loading = 'eager';
          return image.decode();
        }),
    ),
  );
  await expect
    .poll(() =>
      page.evaluate(() =>
        Array.from(document.images)
          .filter(
            (image) =>
              image.currentSrc && (!image.complete || image.naturalWidth === 0),
          )
          .map((image) => image.currentSrc),
      ),
    )
    .toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test('venue filters, title/number search, list/detail navigation and focus restoration', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('.wave-view').click();
  await expect(page.locator('.wave-list button:visible')).toHaveCount(30);
  await page.locator('[data-venue="0"]').click();
  await expect(page.locator('.wave-list button:visible')).toHaveCount(15);
  await page.locator('[data-venue="1"]').click();
  await expect(page.locator('.wave-list button:visible')).toHaveCount(15);
  await page.locator('[data-venue="all"]').click();
  const search = page.getByRole('searchbox');
  await search.fill('memory');
  await expect(page.locator('.wave-list button:visible')).toHaveCount(1);
  await search.fill('30');
  await expect(page.locator('.wave-list button:visible')).toHaveCount(1);
  await page.locator('.wave-list button:visible').click();
  await expect(page.locator('#detail')).toBeVisible();
  await expect(page.locator('#detail-title')).toHaveText('仮作品 30');
  await expect(page.locator('#next-work')).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.locator('.wave-list button:visible')).toBeFocused();
  await search.fill('no such work');
  await expect(page.locator('.wave-empty')).toBeVisible();
  await expect(page.locator('.wave-list')).toBeHidden();
  await search.fill('');
  await page.locator('.wave-list button').first().click();
  await expect(page.locator('#detail-title')).toHaveText('Memory Landscapes');
  await page.locator('#next-work').click();
  await expect(page.locator('#detail-title')).toHaveText('Mollusk');
  await page.locator('.close-detail').click();
  await expect(page.locator('#detail')).not.toBeVisible();
});

test('gallery keyboard selection opens the selected work', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-venue="0"]').click();
  await page.locator('.wave-stage').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.wave-card:focus')).toHaveCount(1);
  const selectedTitle = await page
    .locator('.wave-card:focus img')
    .getAttribute('alt');
  await page.keyboard.press('Enter');
  await expect(page.locator('#detail-title')).toHaveText(selectedTitle!);
  await page.keyboard.press('Escape');
  await expect(page.locator('.wave-card:focus')).toHaveCount(1);
});

test('archive anchors reveal the archive and support keyboard image preview', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.archive-links a')).toHaveCount(29);
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.locator('.footer-nav a[href="#archives"]').click();
  await expect(page).toHaveURL(/#archives$/);
  await expect
    .poll(() =>
      page
        .locator('#archives')
        .evaluate((element) => (element as HTMLElement).inert),
    )
    .toBe(false);
  const link = page.locator('.archive-links a').first();
  await link.focus();
  await expect(link).toHaveClass('active');
  await expect(page.locator('.archive-stage')).toHaveClass(/previewing/);
  await expect(page.locator('#archive-image')).toHaveAttribute(
    'href',
    /assets\/archive\//,
  );
});

test('catalog fetch failure preserves usable fallback links', async ({
  page,
}) => {
  await page.route('**/catalog.json', (route) =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  );
  await page.goto('/preview.html');
  await expect(page.locator('.archive-links a')).toHaveCount(3);
  await expect(page.locator('.wave-list button')).toHaveCount(30);
});
