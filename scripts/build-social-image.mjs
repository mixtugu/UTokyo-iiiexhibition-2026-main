// Render the unchanged exhibition artwork inside a lightweight social-card frame.
// Requires a locally installed Chrome; the generated PNG is committed for deployment.
import { readFile, stat } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const source = new URL(
  '../reference/assets/ogp/iii-exhibition-2026-main.png',
  import.meta.url,
);
const target = new URL(
  '../reference/assets/ogp/iii-exhibition-2026-share.png',
  import.meta.url,
);
const image = (await readFile(source)).toString('base64');
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<html><body style="margin:0;width:1200px;height:630px;background:white;display:flex;justify-content:center;align-items:center"><img alt="" style="width:100%;height:100%;object-fit:contain" src="data:image/png;base64,${image}"></body></html>`,
  );
  await page.locator('img').evaluate((image) => image.decode());
  await page.screenshot({ path: target.pathname });
  console.log(`Social image: 1200×630, ${(await stat(target)).size} bytes`);
} finally {
  await browser.close();
}
