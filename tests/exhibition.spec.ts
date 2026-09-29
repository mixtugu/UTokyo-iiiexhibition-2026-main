import { expect, test } from '@playwright/test';

async function ready(page: import('@playwright/test').Page, path = '/') {
  await page.goto(path);
  await expect(page.locator('html')).toHaveAttribute(
    'data-exhibition-ready',
    'true',
  );
}

test('all reference sections, canvases and image assets load without errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (
      new URL(response.url()).origin === 'http://127.0.0.1:4325' &&
      response.status() >= 400
    )
      errors.push(`${response.status()} ${response.url()}`);
  });
  await ready(page);
  await expect(page.locator('.wave-card')).toHaveCount(30);
  await expect(page.locator('.archive-column-link')).toHaveCount(15);
  for (const id of [
    'top',
    'concept',
    'works',
    'announce',
    'access',
    'members',
    'archives',
  ])
    await expect(page.locator(`section#${id}`)).toHaveCount(1);
  await expect(page.locator('.hero-particles')).toHaveCount(1);
  await expect(page.locator('#marker-canvas')).toHaveCount(1);
  await expect(page.locator('.member-art')).toHaveClass(/marker-ready/);
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
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test('venue filters, real-work list, dialog navigation and focus return match the reference', async ({
  page,
}) => {
  await ready(page, '/preview.html?prototype=works');
  await page.locator('.wave-view').click();
  await expect(page.locator('.wave-list button:visible')).toHaveCount(2);
  await page.locator('[data-venue="0"]').click();
  await expect(page.locator('.wave-list button:visible')).toHaveCount(1);
  await expect(page.locator('.wave-list button:visible')).toContainText(
    'Memory Landscapes',
  );
  await page.locator('[data-venue="1"]').click();
  await expect(page.locator('.wave-list button:visible')).toContainText(
    'Mollusk',
  );
  await page.locator('[data-venue="all"]').click();
  const trigger = page.locator('.wave-list button:visible').first();
  await trigger.click();
  await expect(page.locator('#detail-title')).toHaveText('Memory Landscapes');
  await expect(page.locator('#next-work')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.locator('.wave-list button:visible').nth(1).click();
  await expect(page.locator('#detail-title')).toHaveText('Mollusk');
  await page.locator('.close-detail').click();
  await page.locator('.wave-view').click();
  await expect(page.locator('.wave-stage')).toBeVisible();
  await page.locator('.wave-stage').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.wave-card:focus')).toHaveCount(1);
  await page.keyboard.press('Enter');
  await expect(page.locator('#detail-title')).toHaveText('Memory Landscapes');
});

test('announcement dialogs open and close with keyboard focus restored', async ({
  page,
}) => {
  await ready(page, '/preview.html?prototype=announce');
  const trigger = page.locator('[data-notice="event"]').first();
  await trigger.click();
  await expect(page.locator('#announce-detail')).toBeVisible();
  await expect(page.locator('#notice-body')).toContainText('11/14');
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.locator('[data-notice="information"]').click();
  await expect(page.locator('#notice-heading')).toContainText('登壇者が確定');
  await page.locator('.notice-close').click();
  await expect(page.locator('#announce-detail')).not.toBeVisible();
});

test('archive categories show all 29 records and support keyboard and touch previews', async ({
  page,
  isMobile,
}) => {
  await ready(page);
  await page.locator('#archives').scrollIntoViewIfNeeded();
  const first = page.locator('.archive-column-link').first();
  if (isMobile) await first.tap();
  else await first.focus();
  await expect(first).toHaveClass(/is-active/);
  await expect(first).toHaveAttribute('target', '_blank');
  await page.locator('[data-group="番外展"]').click();
  await expect(page.locator('.archive-column-link')).toHaveCount(14);
  await expect(page.locator('[data-group="番外展"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.locator('[data-group="本展"]').click();
  await expect(page.locator('.archive-column-link')).toHaveCount(15);
});

test('section review routes and direct anchors initialize the same runtime', async ({
  page,
}) => {
  for (const mode of ['works', 'announce', 'members-archives']) {
    await ready(page, `/preview.html?prototype=${mode}`);
    await expect(page.locator('html')).toHaveAttribute('data-prototype', mode);
    await expect(page.locator('.prototype-review-bar')).toBeVisible();
    await expect(page.locator('.top-header')).toBeHidden();
  }
  await ready(page, '/preview.html#archives');
  // The supplied normal-motion page lands at the members/archive boundary.
  await expect
    .poll(() =>
      page
        .locator('#archives')
        .evaluate(
          (element) =>
            Math.abs(element.getBoundingClientRect().top) <= innerHeight + 1 &&
            scrollY > 0,
        ),
    )
    .toBe(true);
});
