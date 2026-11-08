"""Import the supplied bilingual workbook into the reference site's catalog.

Usage: python scripts/import-final-work-copy.py path/to/workbook.xlsx
Only the two copy sheets are read; workbook notes are not executed.
"""
import csv
import json
import re
import sys
import subprocess
from pathlib import Path

import openpyxl

root = Path(__file__).resolve().parents[1]
book = openpyxl.load_workbook(sys.argv[1], data_only=True)
ja = [r for r in book.worksheets[0].values if r[0] and r[0] != '作品ID']
en = {(r[0], r[1]): r for r in book.worksheets[1].values if r[0] and r[0] != '作品ID'}
preview = root / 'reference/preview.js'
source = preview.read_text(encoding='utf8')
match = re.search(r'const works = (\[.*?\]);\r?\n', source)
works = json.loads(match[1])
by_id = {w['id']: w for w in works}
members = {}
with (root / 'docs/data/member-works.csv').open(encoding='utf-8-sig', newline='') as f:
    for row in csv.DictReader(f):
        name = row['漢字（原本）']
        name = re.sub(r'[\s\u3000]+', ' ' if re.search('[A-Za-z]', name) else '', name).strip()
        for line in row['関係作品（参考）'].splitlines():
            members.setdefault(line.split()[0], []).append(name)

translations = {'会場確認中': 'Venue to be confirmed'}
records = []
added = []
for row in ja:
    ident, title = row[:2]
    english = en[(ident, title)]
    # The workbook reuses M25 for two distinct works. Keep both records.
    key = 'X01' if title == 'utena' else ident
    old = by_id.get(key) or (by_id.get('M25-utena') if title == 'utena' else None)
    # I06 has no independent final copy; reuse the existing image and placement.
    if ident == 'I05':
        old = by_id.get('I05') or by_id.get('I06')
    if old is None:
        names = [re.sub(r'[\s\u3000]+', '', n) for n in str(row[3]).split('・')]
        for name in members.get(key, []):
            if name not in names:
                names.append(name)
        old = {'id': key, 'title': title, 'author': '、'.join(names),
               'venue': 'pending', 'image': 'assets/works/image-pending.svg'}
        if ident.startswith('I'):
            old['invited'] = True
        works.append(old)
        added.append({'id': key, 'sourceId': ident, 'title': title, 'author': old['author']})
    if ident == 'I05':
        old['id'] = 'I05'
        old['sourceAliases'] = ['I06']
    if key != ident:
        old['sourceId'] = ident
    # Preserve the established localized title and representative/full author credits.
    if ident in ('I04', 'I05', 'I07'):
        old['title'] = title
    previous = old['description'] if 'description' in old else ''
    credits = re.findall(r'協力[：:][^\n]+', previous)
    if ident == 'I07' and not credits:
        credits = ['協力: 東京大学×NTT サステナブルウェルビーイング社会連携講座']
    old['description'] = (row[8] or '').strip()
    translated = (english[5] or '').strip()
    for credit in credits:
        if credit not in old['description']:
            old['description'] += '\n\n' + credit
            translated += '\n\nCooperation: ' + credit.split(credit[2], 1)[1].strip()
    translations[old['description']] = translated
    records.append({'id': key, 'sourceId': ident, 'title': title,
                    'ja': {'short': row[8], 'long': row[9]},
                    'en': {'short': english[5], 'long': english[6]}})
preview.write_text(source[:match.start(1)] + json.dumps(works, ensure_ascii=False, separators=(',', ':')) + source[match.end(1):], encoding='utf8')
i18n = root / 'reference/i18n.js'
text = i18n.read_text(encoding='utf8')
start = '// BEGIN FINAL WORK COPY\n'
end = '// END FINAL WORK COPY\n'
text = re.sub(re.escape(start) + r'.*?' + re.escape(end), '', text, flags=re.S)
insertion = start + 'Object.assign(exhibitionTranslations, ' + json.dumps(translations, ensure_ascii=False, indent=2) + ');\n' + end
text = text.replace('// Translate text in place', insertion + '\n// Translate text in place')
i18n.write_text(text, encoding='utf8')
(root / 'docs/data/final-work-copy.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
print(json.dumps({'count': len(works), 'added': added}, ensure_ascii=False, indent=2))
if (root / 'docs/data/work-metadata.json').exists():
    subprocess.run([sys.executable, str(root / 'scripts/apply-work-metadata.py')], check=True)
