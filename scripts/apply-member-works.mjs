// Fill each work's author line from docs/data/member-works.csv (roster → related works).
// Existing credits stay as they are (representative first); missing roster members follow in roster order.
// Usage: node scripts/apply-member-works.mjs, then npm run reference:sync.
import { readFileSync, writeFileSync } from 'node:fs';

const csvPath = new URL('../docs/data/member-works.csv', import.meta.url);
const previewPath = new URL('../reference/preview.js', import.meta.url);

function parseCsv(text) {
  const rows = [];
  let row = [],
    field = '',
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Japanese credits on the site are written without spaces (e.g. 三上日向汰); Latin names keep theirs.
const displayName = (name) =>
  /[A-Za-z]/.test(name)
    ? name.trim().replace(/[\s　]+/g, ' ')
    : name.replace(/[\s　]+/g, '');
const sameName = (a, b) =>
  a.replace(/[\s　]+/g, '') === b.replace(/[\s　]+/g, '');

const [header, ...rows] = parseCsv(
  readFileSync(csvPath, 'utf8').replace(/^﻿/, ''),
);
const nameColumn = header.indexOf('漢字（原本）');
const worksColumn = header.indexOf('関係作品（参考）');
const membersByWork = new Map();
for (const row of rows) {
  const name = displayName(row[nameColumn] || '');
  if (!name) continue;
  for (const line of (row[worksColumn] || '').split('\n')) {
    const id = line.trim().split(/\s+/)[0];
    if (!id) continue;
    const names = membersByWork.get(id) || [];
    if (!names.some((other) => sameName(other, name))) names.push(name);
    membersByWork.set(id, names);
  }
}

const source = readFileSync(previewPath, 'utf8');
const match = source.match(/const works = (\[.*?\]);\r?\n/);
const works = JSON.parse(match[1]);
for (const work of works) {
  if (!work.id) continue;
  // Keep every credited name (members outside the roster are added by hand) and append roster members.
  const names = work.author.split('、');
  for (const name of membersByWork.get(work.id) || []) {
    if (!names.some((other) => sameName(other, name))) names.push(name);
  }
  work.author = names.join('、');
  console.log(`${work.id} ${work.title}: ${work.author}`);
}
writeFileSync(
  previewPath,
  source.replace(match[1], () => JSON.stringify(works)),
);
