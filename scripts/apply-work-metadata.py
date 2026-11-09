"""Apply reviewed public work metadata without replacing final bilingual copy."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
metadata = json.loads((root / 'docs/data/work-metadata.json').read_text(encoding='utf8'))
path = root / 'reference/preview.js'
source = path.read_text(encoding='utf8')
match = re.search(r'const works = (\[.*?\]);', source)
works = json.loads(match[1])
by_id = {w['id']: w for w in works}
utena = by_id.get('X01') or by_id.get('M25-utena')
utena['id'] = 'X01'
utena['copySourceId'] = 'M25'
utena.pop('sourceId', None)
sculpture = by_id['I05']
# 構造形態学 and forming patterns are listed together as one work, with the forming patterns photo.
fabric = by_id.get('I06')
if fabric:
    sculpture['image'] = fabric['image']
    works.remove(fabric)
sculpture.pop('sourceAliases', None)
for work in works:
    item = next(m for m in metadata['works'] if m['id'] == work['id'])
    work['venue'] = item['venue']
    work['room'] = item['room']
    if item.get('localImage'):
        work['image'] = item['localImage']['path']
    if work['id'] in ('I05', 'X01'):
        work['title'] = item['title']
    if item.get('author'):
        work['author'] = item['author']
path.write_text(source[:match.start(1)] + json.dumps(works, ensure_ascii=False, separators=(',', ':')) + source[match.end(1):], encoding='utf8')

path = root / 'docs/data/final-work-copy.json'
records = json.loads(path.read_text(encoding='utf8'))
for row in records:
    if row['title'] == 'utena':
        row['id'] = 'X01'
    if row['id'] == 'X01':
        row.setdefault('sourceTitle', 'utena')
        row['title'] = next(item['title'] for item in metadata['works'] if item['id'] == 'X01')
    if row['id'] == 'I05':
        row['title'] = next(item['title'] for item in metadata['works'] if item['id'] == 'I05')
records = [row for row in records if row['id'] != 'I06']
path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
print(f'Applied metadata to {len(works)} works.')
