import { expect, test, type Page } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

async function prepare(page: Page, url: string) {
  await page.route('https://mcp.figma.com/**', (route) =>
    route.fulfill({ body: '' }),
  );
  // Compare the local project independently of external font availability.
  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ body: '', contentType: 'text/css' }),
  );
  await page.addInitScript(() => {
    let seed = 42;
    Math.random = () =>
      (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  });
  await page.goto(url);
  await expect(page.locator('.member-art')).toHaveClass(/marker-ready/);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images)
        .filter((image) => image.getAttribute('src'))
        .map((image) => {
          image.loading = 'eager';
          return image.decode();
        }),
    );
  });
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`source and built page match at ${viewport.width}px`, async ({
    browser,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'reduced-motion',
      'Static parity runs once per viewport with reduced motion.',
    );
    test.setTimeout(90_000);
    const context = await browser.newContext({
      viewport,
      reducedMotion: 'reduce',
      deviceScaleFactor: 1,
    });
    const original = await context.newPage();
    const actual = await context.newPage();
    try {
      await prepare(original, 'http://127.0.0.1:4326/preview.html');
      await prepare(actual, 'http://127.0.0.1:4325/preview.html');
      for (const section of [
        'top',
        'concept',
        'works',
        'announce',
        'access',
        'members',
        'archives',
      ]) {
        for (const page of [original, actual]) {
          await page
            .locator(`#${section}`)
            .evaluate((element) =>
              element.scrollIntoView({ block: 'start', behavior: 'instant' }),
            );
          await page.waitForTimeout(150);
        }
        const before = await original.screenshot({ animations: 'disabled' });
        const after = await actual.screenshot({ animations: 'disabled' });
        const a = PNG.sync.read(before),
          b = PNG.sync.read(after);
        const diff = new PNG({ width: a.width, height: a.height });
        const changed = pixelmatch(
          a.data,
          b.data,
          diff.data,
          a.width,
          a.height,
          { threshold: 0.1 },
        );
        await testInfo.attach(`${section}-reference`, {
          body: before,
          contentType: 'image/png',
        });
        await testInfo.attach(`${section}-reproduction`, {
          body: after,
          contentType: 'image/png',
        });
        if (changed)
          await testInfo.attach(`${section}-difference`, {
            body: PNG.sync.write(diff),
            contentType: 'image/png',
          });
        expect(changed, `${section}: differing pixels`).toBe(0);
      }
      for (const page of [original, actual]) {
        await page.locator('.wave-view').click();
        await page
          .locator('#works')
          .evaluate((element) =>
            element.scrollIntoView({ block: 'start', behavior: 'instant' }),
          );
      }
      const a = PNG.sync.read(
        await original.screenshot({ animations: 'disabled' }),
      );
      const b = PNG.sync.read(
        await actual.screenshot({ animations: 'disabled' }),
      );
      expect(
        pixelmatch(a.data, b.data, undefined, a.width, a.height, {
          threshold: 0.1,
        }),
        'work list',
      ).toBe(0);
    } finally {
      await context.close();
    }
  });
}
