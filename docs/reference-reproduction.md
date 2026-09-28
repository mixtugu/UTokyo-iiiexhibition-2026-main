# Reference reproduction

The current site reproduces `reference/preview.html`, identified by the supplied
README as the integrated exhibition. The source `reference/index.html` is an older
standalone archive experiment, not the integrated homepage.

## Run and review

Use Node 24, `npm ci`, then `npm run dev`. Open
`http://127.0.0.1:4323/` or `/preview.html`.

The source's review modes are also available:

- `/preview.html?prototype=works`
- `/preview.html?prototype=announce`
- `/preview.html?prototype=members-archives`
- `/preview.html?figma-export`

In Storybook, use **Reference → Exhibition → Full Site**, **Works**,
**Announce**, or **Members Archives**. These stories run the same HTML, assets,
styles and classic scripts in an isolated iframe. Existing Design, Components,
Layout and Sections stories retain the earlier component library; their design
controls do not override the reference reproduction.

## Implementation

`index.html` and `preview.html` load all 13 source stylesheets in their original
order. `src/main.ts` mounts `src/reference/page.html` through the typed adapter
`src/reference/mount.ts`, then loads the 14 classic scripts from
`src/reference/scripts.json` in order. The adapter removes the app wrapper, so
body-level selectors and fixed/sticky positioning retain the original DOM
structure. The scripts intentionally retain their shared classic-script scope.
They are source JavaScript, not converted or claimed to be strict TypeScript.

`public/reference-runtime/` contains the original runtime. JavaScript is copied
byte for byte; CSS changes only relative asset URLs to account for its directory.
`source-manifest.json` records source hashes and dependency order. Images and SVG
lettering are copied into `public/assets/` and `public/design-concepts/`.

`public/reference-preview.html` is the standalone Storybook entry. Both this
entry and the application's markup are generated from the same supplied source.
The remote Figma capture helper is omitted; it is an editor integration, not part
of the exhibition. The local `figma-export` view is preserved.

The earlier typed features, reusable components and design tokens remain
available to existing Storybook stories. They are not loaded by the current
homepage because their CSS and interactions differ from this reference.

## Updating the supplied design

After updating `reference/`, run `npm run reference:sync`. This refreshes the
runtime, markup, assets, source manifest and both application entrypoints. Do not
edit generated runtime files directly: a sync replaces them. The reference
folder itself is never modified by the sync or formatter.

Run `npm run check`, `npm run storybook:build`, and `npm run test:storybook`.
`npm test` starts the production build on port 4325 and a read-only reference
server on port 4326. The reference server is a test tool and is not deployed.

The browser suite covers images, JavaScript errors, 30 orbit slots, the two
visible real works, venue filters, work and announcement dialogs, keyboard focus,
archive categories (15 main / 14 extra), review routes and responsive overflow.
The parity suite captures the original and built site at 1440 × 900 and 390 × 844,
with reduced motion and external font responses fixed for deterministic local
comparison. It compares all seven sections and the work list and attaches both
screenshots plus a difference image on mismatch. Normal-motion behavior is
covered separately by the desktop/mobile interaction tests; moving particle
frames are not asserted to be pixel-identical at arbitrary wall-clock times.

Content, provisional works, dates, contact text and source review-mode behavior
are retained exactly, including inconsistencies present in the supplied design.
For example, the next-work button is hidden by the source CSS, and a direct
`#archives` entry with normal motion can land at the members/archive boundary.
