"""Select exhibition visuals, not individual works, from verified page references."""
import concurrent.futures,json,re,urllib.request,urllib.parse
from pathlib import Path
from PIL import Image
from io import BytesIO
root=Path(__file__).resolve().parents[1];out=root/'assets/archive/imported'
items=json.loads((out/'catalog.json').read_text());sources={}
page=Path('/tmp/iii-extra-2021.html').read_text()
for path in set(re.findall(r'teaser_img/past_visuals/[^"\s]+',page)):
    f=path.split('/')[-1]
    m=re.match(r'i3e(\d+)_',f)
    if m:key='main-'+str(1998+int(m[1]))
    else:
        m=re.match(r'iiiEx(\d+)_',f)
        if not m:continue
        key='extra-'+m[1]
    sources[key]='https://archive.iiiexhibition.com/log/iiiEx2021/'+path
sources.update({
 'main-2025':'https://2025-main.pages.dev/images/ogpImage.jpg',
 'main-2024':'https://2024-main.pages.dev/assets/background_desktop-CciUMRI2.webp',
 'main-2022':'https://archive.iiiexhibition.com/log/i3e24/_nuxt/img/hero.7d4c5cc.webp',
 'extra-2025':'https://iii-exhibition2025-beginning.pages.dev/images/logo_large.png',
 'extra-2022':'https://archive.iiiexhibition.com/log/iiiEx2022/images/logo.png',
 'extra-2021':'https://archive.iiiexhibition.com/log/iiiEx2021/teaser_img/Main/desktop.jpg',
})
existing={'main-2023':'assets/archive/main-2023.png','extra-2023':'assets/archive/extra-2023.jpg','extra-2024':'assets/archive/extra-2024.png'}
def run(item):
    key=('main' if item['group']=='EXHIBITION' else 'extra')+'-'+item['year']
    if key in existing:item['image']=existing[key];return item
    if key not in sources:return item
    src=sources[key]
    try:
        req=urllib.request.Request(src,headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req,timeout=25) as r:data=r.read()
        im=Image.open(BytesIO(data));ext='.'+{'JPEG':'jpg','PNG':'png','WEBP':'webp','GIF':'gif'}[im.format]
        dest=out/(key+'-visual'+ext);dest.write_bytes(data)
        item['image']=str(dest.relative_to(root));item['imageSource']=src
        print(key,im.size,flush=True)
    except Exception as e:
        item['image']='';item['error']=str(e);print(key,'FAILED',e,flush=True)
    return item
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:items=list(pool.map(run,items))
(out/'catalog.json').write_text(json.dumps(items,ensure_ascii=False,indent=2))
print('IMAGES',sum(bool(i['image']) for i in items),'/',len(items))
