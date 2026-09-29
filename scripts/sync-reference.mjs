import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { format } from 'prettier';

// Preserve classic-script scope and the source stylesheet cascade.
const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'reference');
const read = (name) => readFile(path.join(source, name), 'utf8');
const write = async (name, value) => {
  const target = path.join(root, name);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(
    target,
    ['index.html', 'preview.html'].includes(name)
      ? await format(value, { filepath: target, singleQuote: true })
      : value,
  );
};
const html = await read('preview.html');
const styles = [
  ...html.matchAll(/<link rel="stylesheet" href="([^"?]+)(?:\?[^"]*)?">/g),
].map((match) => match[1]);
const scripts = [
  ...html.matchAll(/<script src="(?!https:)([^"?]+)(?:\?[^"]*)?"><\/script>/g),
].map((match) => match[1]);
const hashes = {};
for (const name of [...styles, ...scripts]) {
  const original = await read(name);
  hashes[name] = createHash('sha256').update(original).digest('hex');
  const content = name.endsWith('.css')
    ? original.replace(
        /url\((['"]?)(assets\/|design-concepts\/)/g,
        'url($1../$2',
      )
    : original;
  await write(`public/reference-runtime/${name}`, content);
}
for (const directory of ['assets', 'design-concepts']) {
  await cp(path.join(source, directory), path.join(root, 'public', directory), {
    recursive: true,
  });
}
const body = html
  .match(/<body>([\s\S]*)<\/body>/)[1]
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
  .replace(/<link\b[^>]*>/g, '')
  .trim();
await write('src/reference/page.html', body + '\n');
await write(
  'src/reference/scripts.json',
  JSON.stringify(scripts, null, 2) + '\n',
);
await write(
  'public/reference-runtime/source-manifest.json',
  JSON.stringify(
    { source: 'reference/preview.html', styles, scripts, sha256: hashes },
    null,
    2,
  ) + '\n',
);
const head = html
  .match(/<head>([\s\S]*)<\/head>/)[1]
  .replace(/<link rel="stylesheet"[^>]*>/g, '');
const links = styles
  .map((name) => `<link rel="stylesheet" href="./reference-runtime/${name}">`)
  .join('\n');
const mode = `<script>const prototypeView=new URLSearchParams(location.search).get('prototype');if(['works','announce','members-archives'].includes(prototypeView))document.documentElement.dataset.prototype=prototypeView;</script>`;
const entry = `<!doctype html>\n<html lang="ja"><head>${head}\n${links.replaceAll('./reference-runtime/', '/reference-runtime/')}</head><body>${mode}\n<div id="app"></div>\n<script type="module" src="/src/main.ts"></script>\n</body></html>\n`;
await write('index.html', entry);
await write('preview.html', entry);
// Storybook uses the same runtime in an isolated iframe.
await write(
  'public/reference-preview.html',
  `<!doctype html>\n<html lang="ja"><head>${head}\n${links}</head><body>${mode}\n${body}\n${scripts.map((name) => `<script src="./reference-runtime/${name}"></script>`).join('\n')}\n</body></html>\n`,
);
console.log(
  `Synced ${styles.length} stylesheets and ${scripts.length} scripts from reference/preview.html.`,
);
