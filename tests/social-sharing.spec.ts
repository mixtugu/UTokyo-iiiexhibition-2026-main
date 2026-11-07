import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

for (const path of ['/', '/main', '/main/', '/2026/main', '/2026/main/']) {
  test(`social metadata is available without JavaScript at ${path}`, async ({
    request,
  }) => {
    for (const agent of [
      'facebookexternalhit/1.1',
      'Twitterbot/1.0',
      'Line/1.0',
    ]) {
      const response = await request.get(path, {
        headers: { 'User-Agent': agent },
      });
      expect(response.ok()).toBeTruthy();
      const html = await response.text();
      expect(html).toContain('rel="canonical"');
      expect(html).toMatch(
        /property="og:image"\s+content="https:\/\/iiiexhibition.com\/assets\/ogp\/iii-exhibition-2026-share.png"/,
      );
      expect(html).toMatch(
        /name="twitter:card"\s+content="summary_large_image"/,
      );
    }
  });
}

test('social image is a compact, correctly sized PNG', async ({ request }) => {
  const response = await request.get(
    '/assets/ogp/iii-exhibition-2026-share.png',
  );
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('image/png');
  const image = await response.body();
  expect(image.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(image.readUInt32BE(16)).toBe(1200);
  expect(image.readUInt32BE(20)).toBe(630);
  expect(image.length).toBeLessThan(300_000);
  const robots = await request.get('/robots.txt');
  expect(robots.headers()['content-type']).toContain('text/plain');
  expect(await robots.text()).toContain('Allow: /');
});

test('both deployment hosts normalize main aliases to the canonical root', () => {
  const redirects = readFileSync('public/_redirects', 'utf8');
  for (const alias of ['/main', '/main/', '/2026/main', '/2026/main/']) {
    expect(redirects).toMatch(new RegExp(`^${alias}\\s+/\\s+301$`, 'm'));
  }
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
  expect(vercel.redirects).toEqual(
    expect.arrayContaining([
      { source: '/main/:path*', destination: '/', permanent: true },
      { source: '/2026/main/:path*', destination: '/', permanent: true },
    ]),
  );
});
