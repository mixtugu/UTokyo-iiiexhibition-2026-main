import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const works: { title: string; venue: string; invited?: boolean }[] = JSON.parse(
  readFileSync('reference/preview.js', 'utf8').match(
    /const works = (\[.*?\]);/s,
  )![1],
);

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
  await expect(page.locator('.archive-column-link')).toHaveCount(43);
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
  await page.addStyleTag({
    content: 'html { scroll-behavior: auto !important; }',
  });
  const prefix = isMobile ? 'mobile' : 'desktop';
  const cards = page.locator(
    isMobile
      ? '.works-mobile-card, .works-mobile-feature'
      : 'button.works-desktop-card',
  );
  const invited = works
    .filter((work) => work.invited)
    .map((work) => work.title);
  const pagination = page.locator('.works-desktop-pagination button');
  async function expectCatalog(expected: typeof works) {
    const titles: string[] = [];
    const pageCount = isMobile ? 1 : await pagination.count();
    for (let index = 0; index < pageCount; index++) {
      if (!isMobile) await pagination.nth(index).click();
      titles.push(
        ...(await cards
          .locator(
            '.works-desktop-title, .works-mobile-feature-title, .works-mobile-card-title',
          )
          .allTextContents()),
      );
    }
    expect(titles.sort()).toEqual(expected.map((work) => work.title).sort());
  }
  await expectCatalog(works);
  if (!isMobile) await pagination.first().click();
  if (isMobile) {
    await expect(page.locator('.works-mobile-feature-title')).toHaveText(
      invited,
    );
    await expect(page.locator('.works-mobile-card').first()).toHaveText(
      /vi-Vinci/,
    );
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
  const buildingA = works.filter((work) => work.venue.split(',').includes('0'));
  await expectCatalog(buildingA);
  if (isMobile)
    await expect(page.locator('.works-mobile-feature')).toHaveCount(
      buildingA.filter((work) => work.invited).length,
    );
  await page.locator(`[data-${prefix}-venue="invite"]`).click();
  await expectCatalog(works.filter((work) => work.invited));
  if (isMobile) {
    await expect(page.locator('.works-mobile-feature')).toHaveCount(
      invited.length,
    );
    await expect(page.locator('.works-mobile-card')).toHaveCount(0);
  }
  await page.locator(`[data-${prefix}-venue="1"]`).click();
  await expectCatalog(
    works.filter((work) => work.venue.split(',').includes('1')),
  );
  // MoHeat retains its confirmed building when shown as an invitation.
  if (!isMobile) await pagination.first().click();
  await expect(cards.filter({ hasText: 'MoHeat Evo' })).toContainText(
    '情報学環本館',
  );
  await page.locator(`[data-${prefix}-venue="all"]`).click();
  const catalog = [
    ['vi-Vinci', '三上日向汰', 'vi-vinci.jpg', 'ベストプレゼンテーション賞'],
    ['MoHeat Evo', 'Jiayi Xu', 'moheat.jpg', 'LEDの可視光とエタノールミスト'],
    [
      'forming patterns',
      '上條陽斗',
      'forming-patterns.jpg',
      'それと認知の結びつきを探っている。',
    ],
    // Credits list every participating member, representative first.
    [
      'paw walk',
      '牧田陽奈子、杉本隆平',
      'paw-walk.jpg',
      '犬の肉球が受ける歩行感',
    ],
    [
      'Programmable Strap',
      '猪原大智',
      'programmable-strap.jpg',
      'つり革型のインタラクティブメディア',
    ],
  ];
  for (const [title, author, image, description] of catalog) {
    const trigger = cards.filter({ hasText: title });
    if (!isMobile) {
      await pagination.first().click();
      for (
        let index = 1;
        !(await trigger.count()) && index < (await pagination.count());
        index++
      ) {
        await pagination.nth(index).click();
      }
    }
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
      await expect(detail.locator('.detail-type')).toHaveCount(0);
    }
    await expect(page.getByText('じっくり')).toHaveCount(0);
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
    // Members with a profile (SNS / web page) are linked from their credits.
    const profile = detail.locator('a.member-profile-link');
    if (title === 'Programmable Strap') {
      await expect(profile).toHaveText('猪原大智');
      await expect(profile).toHaveAttribute('href', 'https://inotai.net/about');
      await expect(profile).toHaveAttribute('target', '_blank');
      // Same weight as the surrounding credit; only a faint underline marks the link.
      expect(
        await profile.evaluate(
          (a) =>
            getComputedStyle(a).fontWeight ===
            getComputedStyle(a.parentElement!).fontWeight,
        ),
      ).toBe(true);
    } else await expect(profile).toHaveCount(0);
    if (isMobile && invited.includes(title))
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

test('archive categories show all 43 records and support keyboard and touch previews', async ({
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
  ).toHaveCount(22);
  await expect(
    page.locator('[data-group="番外展"] .archive-column-link'),
  ).toHaveCount(21);
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
