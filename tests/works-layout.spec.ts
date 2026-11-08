import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const works: { title: string; venue: string; invited?: boolean }[] = JSON.parse(
  readFileSync('reference/preview.js', 'utf8').match(
    /const works = (\[.*?\]);/s,
  )![1],
);

test('catalog fits images below tags and packs every page without interior gaps', async ({
  page,
  isMobile,
}) => {
  for (const width of isMobile ? [320, 390] : [701, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/?prototype=works');
    await expect(page.locator('html')).toHaveAttribute(
      'data-exhibition-ready',
      'true',
    );
    const prefix = isMobile ? 'mobile' : 'desktop';
    for (const venue of ['all', '0', '1', 'invite']) {
      await page.locator(`[data-${prefix}-venue="${venue}"]`).click();
      const expected = works.filter(
        (w) =>
          venue === 'all' ||
          (venue === 'invite' ? w.invited : w.venue.split(',').includes(venue)),
      );
      const seen: string[] = [];
      const pages = isMobile
        ? 1
        : await page.locator('.works-desktop-pagination button').count();
      for (let index = 0; index < pages; index++) {
        if (!isMobile)
          await page
            .locator('.works-desktop-pagination button')
            .nth(index)
            .click();
        const cards = page.locator(
          isMobile
            ? '.works-mobile-feature, .works-mobile-card'
            : '.works-desktop-card',
        );
        const layout = await cards.evaluateAll((cards) =>
          cards.map((card) => {
            const rect = (element: Element) => {
              const r = element.getBoundingClientRect();
              return {
                x: r.x,
                y: r.y,
                right: r.right,
                bottom: r.bottom,
                width: r.width,
              };
            };
            return {
              title: card.querySelector(
                '.works-desktop-title, .works-mobile-feature-title, .works-mobile-card-title',
              )!.textContent!,
              invited: card.matches('.is-invited, .works-mobile-feature'),
              card: rect(card),
              tags: rect(
                card.querySelector('.works-desktop-tags, .works-mobile-tags')!,
              ),
              image: rect(card.querySelector('img')!),
              text: rect(
                card.querySelector(
                  '.works-desktop-title, .works-mobile-feature-title, .works-mobile-card-title',
                )!,
              ),
            };
          }),
        );
        seen.push(...layout.map((item) => item.title));
        for (const item of layout) {
          expect(item.image.y, item.title).toBeGreaterThanOrEqual(
            item.tags.bottom,
          );
          expect(item.image.x, item.title).toBeGreaterThanOrEqual(item.card.x);
          expect(item.image.right, item.title).toBeLessThanOrEqual(
            item.card.right,
          );
          expect(item.image.bottom, item.title).toBeLessThanOrEqual(
            item.card.bottom,
          );
          expect(item.text.bottom, item.title).toBeLessThanOrEqual(
            item.card.bottom,
          );
          if (item.invited)
            expect(item.text.right, item.title).toBeLessThanOrEqual(
              item.image.x,
            );
          else
            expect(
              Math.abs(
                (item.image.x + item.image.right) / 2 -
                  (item.card.x + item.card.right) / 2,
              ),
            ).toBeLessThan(1);
        }
        if (!isMobile) {
          if (index < pages - 1)
            expect(
              layout.reduce((cells, item) => cells + (item.invited ? 2 : 1), 0),
            ).toBe(12);
          const rows = new Map<number, typeof layout>();
          for (const item of layout) {
            const y = Math.round(item.card.y);
            rows.set(y, [...(rows.get(y) ?? []), item]);
          }
          for (const row of rows.values()) {
            row.sort((a, b) => a.card.x - b.card.x);
            expect(row[0].card.x).toBeLessThanOrEqual(1);
            for (let i = 1; i < row.length; i++)
              expect(
                Math.abs(row[i].card.x - row[i - 1].card.right),
              ).toBeLessThan(1);
          }
        }
      }
      expect(seen.sort()).toEqual(expected.map((work) => work.title).sort());
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
});
