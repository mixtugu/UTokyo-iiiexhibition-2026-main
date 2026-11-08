"""Apply reviewed public work metadata without replacing final bilingual copy."""
import copy
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
if 'I06' not in by_id:
    fabric = copy.deepcopy(sculpture)
    fabric.update(id='I06', title='forming patterns', sharedCopyFrom='I05')
    fabric.pop('sourceAliases', None)
    works.insert(works.index(sculpture) + 1, fabric)
    # The existing image belongs to forming patterns, not the separate sculpture.
    sculpture['image'] = 'assets/works/image-pending.svg'
sculpture.pop('sourceAliases', None)
next(work for work in works if work['id'] == 'I06')['description'] = sculpture['description']
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
        row['title'] = '構造形態学'
records = [row for row in records if row['id'] != 'I06']
row = copy.deepcopy(next(row for row in records if row['id'] == 'I05'))
row.update(id='I06', title='forming patterns', sharedCopyFrom='I05')
records.append(row)
path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
print(f'Applied metadata to {len(works)} works.')
