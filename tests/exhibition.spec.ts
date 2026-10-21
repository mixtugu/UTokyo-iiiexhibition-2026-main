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
  await expect(
    page.locator('#works .works-desktop, #works .works-mobile'),
  ).toHaveCount(2);
  await expect(page.locator('.archive-column-link')).toHaveCount(30);
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

test('works stay hidden behind the upcoming notice until they are published', async ({
  page,
  isMobile,
}) => {
  await ready(page, '/preview.html?prototype=works');
  const prefix = isMobile ? 'mobile' : 'desktop';
  await expect(page.locator(`[data-${prefix}-venue]`)).toHaveText([
    'ALL',
    '会場A',
    '会場B',
    '招待作品',
  ]);
  await expect(page.locator('.works-upcoming')).toHaveText(
    '作品は順次追加予定です。',
  );
  await expect(
    page.locator(
      '.works-desktop-card, .works-mobile-card, .works-mobile-feature',
    ),
  ).toHaveCount(0);
});

// Re-enable together with `worksPublished` in reference/works-wave.js.
test.skip('venue filters, real-work list, dialog navigation and focus return match the reference', async ({
  page,
  isMobile,
}) => {
  await ready(page, '/preview.html?prototype=works');
  if (isMobile) {
    await expect(page.locator('.works-mobile')).toBeVisible();
    await expect(page.locator('.wave-stage')).toHaveCount(0);
    await expect(page.locator('.works-mobile-feature')).toBeVisible();
    await page.locator('[data-mobile-venue="0"]').click();
    await expect(page.locator('.works-mobile-feature')).toHaveCount(0);
    await expect(page.locator('.works-mobile-card').first()).toContainText(
      'Memory Landscapes',
    );
    await page.locator('[data-mobile-venue="1"]').click();
    await expect(page.locator('.works-mobile-card').first()).toContainText(
      'Mollusk',
    );
    await page.locator('[data-mobile-venue="all"]').click();
    const trigger = page.locator('.works-mobile-feature');
    await trigger.click();
    await expect(page.locator('.works-mobile-detail')).toBeVisible();
    await expect(page.locator('.works-mobile-detail h3')).toHaveText(
      'Memory Landscapes',
    );
    await expect(page.locator('.works-mobile-detail-body')).toContainText(
      'ダミーテキストです',
    );
    await page.locator('.works-mobile-back').click();
    await expect(page.locator('.works-mobile-list')).toBeVisible();
    await expect(trigger).toBeFocused();
    return;
  }
  await expect(page.locator('.works-desktop')).toBeVisible();
  await expect(page.locator('.works-desktop-card')).toHaveCount(11);
  await expect(page.locator('.wave-stage')).toHaveCount(0);
  await page.locator('[data-desktop-venue="0"]').click();
  await expect(
    page.locator('.works-desktop-card:not(.is-placeholder)').first(),
  ).toContainText('Memory Landscapes');
  await page.locator('[data-desktop-venue="1"]').click();
  await expect(
    page.locator('.works-desktop-card:not(.is-placeholder)').first(),
  ).toContainText('Mollusk');
  await page.locator('[data-desktop-venue="invite"]').click();
  await expect(page.locator('.works-desktop-card.is-invited')).toContainText(
    '招待作品タイトル',
  );
  await page.locator('[data-desktop-venue="all"]').click();
  const trigger = page
    .locator('button.works-desktop-card:not(.is-placeholder)')
    .first();
  await trigger.click();
  await expect(page.locator('#detail-title')).toHaveText('Memory Landscapes');
  await expect(page.locator('#next-work')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.locator('[data-desktop-venue="1"]').click();
  await page
    .locator('button.works-desktop-card:not(.is-placeholder)')
    .first()
    .click();
  await expect(page.locator('#detail-title')).toHaveText('Mollusk');
  await page.locator('.close-detail').click();
});

test('announcements retain the fund without cancelled talk event links', async ({
  page,
}) => {
  await ready(page, '/preview.html?prototype=announce');
  await expect(page.locator('.announce-fund')).toBeVisible();
  await expect(page.locator('.announce-talk, #announce-detail')).toHaveCount(0);
  await expect(
    page.locator('#announce a[href*="talkevent.peatix"]'),
  ).toHaveCount(0);
});

test('archive categories show all 30 records and support keyboard and touch previews', async ({
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
  await expect(page.locator('.archive-group')).toHaveCount(2);
  await expect(
    page.locator('[data-group="本展"] .archive-column-link'),
  ).toHaveCount(15);
  await expect(
    page.locator('[data-group="番外展"] .archive-column-link'),
  ).toHaveCount(15);
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
  // Normal motion lands at the start of the members → archives journey; members may be taller than the screen.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const members = document.querySelector('#members');
        const archives = document.querySelector('#archives');
        if (!members || !archives || scrollY <= 0) return false;
        return (
          Math.abs(members.getBoundingClientRect().top) <= 2 ||
          Math.abs(archives.getBoundingClientRect().top) <= innerHeight + 1
        );
      }),
    )
    .toBe(true);
});
