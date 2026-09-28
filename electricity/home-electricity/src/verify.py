"""Validate generated document structure and self-contained asset references."""
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import re
import xml.etree.ElementTree as ET

class Document(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=[]; self.links=[]; self.remote_assets=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag=='a':self.links.append(a)
        if tag in ['script','img','link','iframe','video','audio']:
            u=a.get('src',a.get('href',''))
            if u.startswith(('https:','http:','//')):self.remote_assets.append(u)

for name in ['一眼看懂家庭用电.html','家庭用电全景拓扑图.html']:
    page=(Path(__file__).resolve().parent.parent/name).read_text(encoding='utf-8')
    d=Document();d.feed(page)
    assert not [i for i,n in Counter(d.ids).items() if n>1], 'Duplicate IDs'
    assert not re.search(r'\{\{[A-Z]+\}\}',page),'Unexpanded source placeholder'
    assert not d.remote_assets,'Offline experience depends on remote assets'
    for a in d.links:
        if a.get('href','').startswith('#'):continue
        assert a.get('target')=='_blank',a
        assert 'noopener' in a.get('rel',''),a
    svgs=re.findall(r'<svg\b[\s\S]*?</svg>',page)
    # Match only actual markup, before inline scripts that contain SVG string templates.
    markup=page.split('<script>')[0]
    svgs=re.findall(r'<svg\b[\s\S]*?</svg>',markup)
    for svg in svgs:
        ET.fromstring(svg)
    print(f'{name}: unique IDs, {len(svgs)} valid SVG fragments, safe links, self-contained assets.')
