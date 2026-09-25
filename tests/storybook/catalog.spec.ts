import { expect, test } from '@playwright/test';

const story = (id: string, args = '') =>
  `/iframe.html?id=${id}&viewMode=story${args ? `&args=${args}` : ''}`;

test('every catalog story renders with its real components and assets', async ({
  page,
  request,
}) => {
  const response = await request.get('/index.json');
  expect(response.ok()).toBe(true);
  const { entries } = (await response.json()) as {
    entries: Record<string, { id: string; type: string }>;
  };
  const stories = Object.values(entries).filter(
    (entry) => entry.type === 'story',
  );
  expect(stories.length).toBeGreaterThanOrEqual(18);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (
      response.url().startsWith('http://127.0.0.1:6007') &&
      response.status() >= 400
    )
      errors.push(`${response.status()} ${response.url()}`);
  });
  for (const { id } of stories) {
    await page.goto(story(id));
    await expect(page.locator('#storybook-root > *')).not.toHaveCount(0);
    await expect(page.locator('.sb-errordisplay')).not.toBeVisible();
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
  }
  expect(errors).toEqual([]);
});

test('token controls affect layout, type, target size and crop and reset between stories', async ({
  page,
}) => {
  await page.goto(
    story(
      'design-tokens--playground',
      'override:!true;gutter:64;contentWidth:640;bodySize:22;targetSize:64;imageFit:cover',
    ),
  );
  await expect(page.locator('.sb-copy')).toHaveCSS('font-size', '22px');
  await expect(page.locator('.ui-button').first()).toHaveCSS(
    'min-height',
    '64px',
  );
  await expect(page.locator('.wave-list img').first()).toHaveCSS(
    'object-fit',
    'cover',
  );
  const panel = page.locator('.sb-foundation');
  expect(
    await panel.evaluate((el) =>
      Number.parseFloat(getComputedStyle(el).paddingLeft),
    ),
  ).toBeGreaterThanOrEqual(64);
  await page.goto(story('design-tokens--playground'));
  await expect(page.locator('.sb-copy')).toHaveCSS('font-size', '17px');
  await expect(page.locator('.ui-button').first()).toHaveCSS(
    'min-height',
    '48px',
  );
});

test('dialog story supports open, next, close and focus return', async ({
  page,
}) => {
  await page.goto(story('components-work-dialog--default'));
  const trigger = page.getByRole('button', {
    name: '作品詳細を開く',
    exact: true,
  });
  await trigger.click();
  await expect(page.locator('#detail-title')).toHaveText('Memory Landscapes');
  await page.locator('#next-work').click();
  await expect(page.locator('#detail-title')).toHaveText('Mollusk');
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('mobile long labels and content sections remain within the viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const id of [
    'components-section-heading--long-text',
    'components-work-card--long-title',
    'layout-navigation--header',
    'layout-navigation--footer',
    'sections-content--access',
    'sections-content--donation',
  ]) {
    await page.goto(story(id));
    await expect(page.locator('#storybook-root > *')).not.toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      id,
    ).toBe(true);
  }
});
