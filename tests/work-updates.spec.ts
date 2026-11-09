import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

test('final copy covers 32 distinct works with confirmed placement and English descriptions', () => {
  const source = readFileSync('reference/preview.js', 'utf8');
  const works = JSON.parse(source.match(/const works = (\[.*?\]);/s)![1]);
  const translations = runInNewContext(
    readFileSync('reference/i18n.js', 'utf8').split(
      '// Translate text in place',
    )[0] + '\nexhibitionTranslations;',
  );
  expect(works).toHaveLength(32);
  expect(new Set(works.map((work: { id: string }) => work.id)).size).toBe(32);
  expect(
    works.filter((work: { venue: string }) => work.venue === 'pending'),
  ).toHaveLength(0);
  expect(works.find((work: { id: string }) => work.id === 'M07').venue).toBe(
    '1',
  );
  expect(works.find((work: { id: string }) => work.id === 'M08').venue).toBe(
    '0',
  );
  expect(works.find((work: { id: string }) => work.id === 'M12').venue).toBe(
    '0,1',
  );
  // 構造形態学 and forming patterns are listed as one work.
  expect(works.find((work: { id: string }) => work.id === 'I05').title).toBe(
    '構造形態学/forming patterns',
  );
  expect(
    works.find((work: { id: string }) => work.id === 'I06'),
  ).toBeUndefined();
  expect(
    works.find((work: { id: string }) => work.id === 'M11'),
  ).toBeUndefined();
  for (const work of works) {
    expect(translations[work.description], work.title).toBeTruthy();
  }
  expect(works.find((work: { id: string }) => work.id === 'M25').title).toBe(
    'Threshold',
  );
  expect(works.find((work: { id: string }) => work.id === 'X01').title).toBe(
    'フォーラムのモニュメント',
  );
});

test('new invited work opens with final English copy and confirmed venue', async ({
  page,
  isMobile,
}) => {
  await page.goto('/?lang=en');
  await page
    .locator(
      isMobile
        ? '[data-mobile-venue="invite"]'
        : '[data-desktop-venue="invite"]',
    )
    .click();
  const cards = page.locator(
    isMobile
      ? '.works-mobile-card, .works-mobile-feature'
      : '.works-desktop-card',
  );
  if (!isMobile) {
    const pagination = page.locator('.works-desktop-pagination button');
    for (
      let index = 1;
      !(await cards.filter({ hasText: 'EmoJammer' }).count()) &&
      index < (await pagination.count());
      index++
    ) {
      await pagination.nth(index).click();
    }
  }
  await cards.filter({ hasText: 'EmoJammer' }).click();
  const detail = page.locator(isMobile ? '.works-mobile-detail' : '#detail');
  await expect(detail).toContainText(
    'When we encounter emotionally provocative posts',
  );
  await expect(detail).toContainText('Cooperation:');
  if (isMobile) await expect(detail).toContainText('iii Main Building');
  await expect(detail).not.toContainText('Venue to be confirmed');
  await expect(detail.locator('img').first()).toHaveJSProperty(
    'naturalWidth',
    1800,
  );
});

test('work title follows the selected language', async ({ page }) => {
  await page.goto('/');
  await page.locator('body > .language-switch [data-language="ja"]').click();
  await expect(page.locator('#works')).toContainText('東京共鳴線');
  await page.locator('body > .language-switch [data-language="en"]').click();
  await expect(page.locator('#works')).toContainText('Tokyo Resonance Lines');
  await expect(page.locator('#works')).not.toContainText('東京共鳴線');
});

test('Emojammer cooperation credit is appended once without changing other works', () => {
  const works = [
    { title: 'Emojammer', description: 'Original introduction' },
    { title: 'Other work', description: 'Unchanged' },
  ];
  const source = readFileSync('reference/work-credits.js', 'utf8');
  const context = { works };
  runInNewContext(source, context);
  runInNewContext(source, context);
  expect(works[0].description).toBe(
    'Original introduction\n\n協力: 東京大学×NTT サステナブルウェルビーイング社会連携講座',
  );
  expect(works[1].description).toBe('Unchanged');
});

test('OGP is present in server HTML and its image is served as a PNG', async ({
  request,
}) => {
  const response = await request.get('/');
  const html = await response.text();
  for (const property of ['og:title', 'og:description', 'og:url', 'og:image']) {
    expect(html).toMatch(
      new RegExp(`property="${property}"\\s+content="[^"]+"`),
    );
  }
  const url = html.match(/property="og:image"\s+content="([^"]+)"/)![1];
  const image = await request.get(new URL(url).pathname);
  expect(image.ok()).toBeTruthy();
  expect(image.headers()['content-type']).toContain('image/png');
  expect((await image.body()).subarray(0, 8).toString('hex')).toBe(
    '89504e470d0a1a0a',
  );
});

test('Tokyo Resonance Lines author uses the selected language and portfolio link', async ({
  page,
  isMobile,
}) => {
  for (const [language, title, name] of [
    ['ja', '東京共鳴線', 'キム ジェミン'],
    ['en', 'Tokyo Resonance Lines', 'Jaemin Kim'],
  ]) {
    await page.goto(`/?lang=${language}`);
    const cards = page.locator(
      '.works-desktop-card:visible, .works-mobile-feature:visible, .works-mobile-card:visible',
    );
    await cards.filter({ hasText: title }).click();
    const detail = page.locator(isMobile ? '.works-mobile-detail' : '#detail');
    const link = detail.getByRole('link', { name, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute(
      'href',
      'https://loveisanopendoor.github.io/',
    );
    await expect(link).toHaveAttribute('target', '_blank');
  }
});
