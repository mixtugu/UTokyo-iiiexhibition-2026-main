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

test('confirmed works show supplied images, authors, descriptions and invitation filters', async ({
  page,
  isMobile,
}) => {
  await ready(page, '/preview.html?prototype=works');
  const prefix = isMobile ? 'mobile' : 'desktop';
  const cards = page.locator(
    isMobile
      ? '.works-mobile-card, .works-mobile-feature'
      : 'button.works-desktop-card',
  );
  await expect(cards).toHaveCount(3);
  if (isMobile) {
    await expect(page.locator('.works-mobile-feature')).toHaveText([
      /MoHeat/,
      /forming patterns/,
    ]);
    await expect(page.locator('.works-mobile-card')).toHaveText(/vi-Vinci/);
    await expect(page.locator('.works-mobile-grid')).toHaveCSS(
      'grid-template-columns',
      /^(?:\d+(?:\.\d+)?px ){1}\d+(?:\.\d+)?px$/,
    );
  } else {
    await expect(page.locator('.works-desktop-grid')).toHaveCSS(
      'grid-template-columns',
      /^(?:\d+(?:\.\d+)?px ){3}\d+(?:\.\d+)?px$/,
    );
    await expect(
      page.locator('.works-desktop-card.is-invited').first(),
    ).toHaveCSS('grid-column-start', 'span 2');
  }
  await page.locator(`[data-${prefix}-venue="0"]`).click();
  await expect(cards).toHaveCount(3);
  if (isMobile)
    await expect(page.locator('.works-mobile-feature')).toHaveCount(2);
  await page.locator(`[data-${prefix}-venue="invite"]`).click();
  await expect(cards).toHaveCount(2);
  if (isMobile) {
    await expect(page.locator('.works-mobile-feature')).toHaveCount(2);
    await expect(page.locator('.works-mobile-card')).toHaveCount(0);
  }
  await expect(cards).toContainText(['MoHeat', 'forming patterns']);
  await page.locator(`[data-${prefix}-venue="1"]`).click();
  await expect(cards).toHaveCount(0);
  await page.locator(`[data-${prefix}-venue="all"]`).click();
  const catalog = [
    ['vi-Vinci', '三上日向汰', 'vi-vinci.png', 'ベストプレゼンテーション賞'],
    ['MoHeat', 'Jiayi Xu', 'moheat.jpg', 'LEDの可視光とエタノールミスト'],
    [
      'forming patterns',
      '上條陽斗',
      'forming-patterns.png',
      'それと認知の結びつきを探っている。',
    ],
  ];
  for (const [title, author, image, description] of catalog) {
    const trigger = cards.filter({ hasText: title });
    await trigger.click();
    const detail = page.locator(isMobile ? '.works-mobile-detail' : '#detail');
    await expect(detail).toBeVisible();
    if (isMobile) {
      await expect(detail.locator('.works-mobile-detail-image')).toHaveCSS(
        'width',
        await detail.evaluate((el) => `${el.clientWidth}px`),
      );
      await expect(detail.locator('h3')).toHaveCSS('color', 'rgb(70, 168, 61)');
    } else {
      await expect(detail.locator('.detail-copy > .detail-venue')).toHaveCount(
        0,
      );
      await expect(detail.locator('.detail-type')).toHaveText(
        '鑑賞タイプじっくり',
      );
    }
    await expect(detail.locator(isMobile ? 'h3' : '#detail-title')).toHaveText(
      title,
    );
    await expect(
      detail.locator(isMobile ? '.works-mobile-detail-meta' : '.detail-author'),
    ).toHaveText(author);
    await expect(
      detail.locator(
        isMobile ? '.works-mobile-detail-body' : '#detail-description',
      ),
    ).toContainText(description);
    const picture = detail.locator(
      isMobile ? '.works-mobile-detail-image' : '#detail-image',
    );
    await expect(picture).toHaveAttribute('src', `assets/works/${image}`);
    await expect
      .poll(() =>
        picture.evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
      )
      .toBe(true);
    if (isMobile && title !== 'vi-Vinci')
      await expect(detail).toContainText('招待作品');
    if (isMobile) await page.locator('.works-mobile-back').click();
    else await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  }
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
