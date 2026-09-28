"""Collect user-requested archive links and preview assets for the local prototype."""
import concurrent.futures, html, json, re, urllib.request, urllib.parse
from pathlib import Path
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/archive/imported'
OUT.mkdir(parents=True,exist_ok=True)
class Tags(HTMLParser):
    def __init__(self): super().__init__(); self.tags=[]
    def handle_starttag(self,tag,attrs): self.tags.append((tag,dict(attrs)))
def fetch(url):
    req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
    with urllib.request.urlopen(req,timeout=18) as r: return r.read(),r.url,r.headers.get_content_type()
source=Path('/tmp/iii-archive-source.html').read_text()
items=[];seen=set()
for url,body in re.findall(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>',source,re.S):
    label=html.unescape(re.sub('<[^>]+>','',body)).strip()
    m=re.match(r'(iiiExhibition|Beginning|Extra)\s+(20\d\d)\s*[:：]\s*(.+)',label)
    if not m or url in seen: continue
    seen.add(url);kind,year,title=m.groups()
    items.append(dict(group='EXHIBITION' if kind=='iiiExhibition' else 'BEGINNING / EXTRA',year=year,title=title,url=html.unescape(url),image=''))
def collect(item):
    key=('main' if item['group']=='EXHIBITION' else 'extra')+'-'+item['year']
    try:
        raw,url,_=fetch(item['url']);page=raw.decode('utf-8','replace')
        Path('/tmp/iii-'+key+'.html').write_text(page)
        tags=Tags();tags.feed(page);candidates=[]
        for tag,a in tags.tags:
            src='';score=0
            if tag=='meta' and a.get('property',a.get('name','')) in ('og:image','twitter:image'):
                src=a.get('content','');score=20
                if src=='https://iiiexhibition.com/ogp.png': continue
            if tag=='img':
                src=a.get('src',a.get('data-src',''));desc=(src+' '+a.get('alt','')).lower()
                score=5
                if re.search(r'main.?visual|key.?visual|poster|flyer|ogp|kv[._/]|hero|top[._/]',desc):score+=30
                if re.search(r'logo|icon|twitter|facebook|instagram|sponsor|map|arrow|button',desc):score-=50
            if src and not src.startswith('data:'):candidates.append((score,urllib.parse.urljoin(url,html.unescape(src))))
        for src in re.findall(r'url\([\s\'"]*([^\)\'"\s]+)',page):
            if re.search(r'\.(png|jpe?g|webp)',src,re.I):candidates.append((12,urllib.parse.urljoin(url,src)))
        candidates=sorted(set(candidates),reverse=True)
        item['candidates']=candidates[:6]
        for score,src in candidates[:8]:
            if score<0:continue
            try:
                data,actual,mime=fetch(src)
                if mime not in ('image/png','image/jpeg','image/webp','image/gif'):continue
                from PIL import Image
                from io import BytesIO
                im=Image.open(BytesIO(data))
                if min(im.size)<180:continue
                ext={'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp','image/gif':'.gif'}[mime]
                dest=OUT/(key+ext);dest.write_bytes(data)
                item['image']=str(dest.relative_to(ROOT));item['imageSource']=actual;break
            except Exception:pass
    except Exception as e:item['error']=str(e)
    print(key,item['image'] or 'NO IMAGE',flush=True)
    return item
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: results=list(pool.map(collect,items))
(OUT/'catalog.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print('TOTAL',len(results),'WITH IMAGES',sum(bool(i['image']) for i in results))
