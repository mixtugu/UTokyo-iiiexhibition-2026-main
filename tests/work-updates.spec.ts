import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

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
