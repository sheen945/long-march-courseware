# -*- coding: utf-8 -*-
"""递归抓取长征课件资源 v2（根相对 + 目录相对双解析）"""
import json, os, re, requests, posixpath

OUT = r"D:\daima\rea-aifuneng\recon"
SITE = r"D:\daima\rea-aifuneng\site"
lease = json.load(open(os.path.join(OUT, "lease.json"), encoding="utf-8"))
BASE, TOKEN = lease["base"], lease["token"]
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/156.0 Safari/537.36",
     "Referer": "https://aifunengjiaoyu.com/"}

TEXTISH = (".html", ".js", ".mjs", ".css", ".json", ".svg", ".txt")
ASSET_EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".mp3", ".mp4", ".webm", ".wav", ".ogg",
             ".m4a", ".json", ".js", ".css", ".html", ".glb", ".gltf", ".ktx2", ".bin", ".hdr", ".env",
             ".ttf", ".otf", ".woff2", ".woff", ".txt", ".data", ".ktx", ".basis", ".webmanifest", ".xml")

seeds = [
    "index.html", "courseware/website-bridge.js", "courseware/runtime.js", "courseware/classroom.css",
    "courseware/classroom.js", "shared-audio.css", "shared-audio.js", "shared-ui/unified-topbar.css",
    "shared-ui/unified-topbar.js", "hide-map-overlay-button.js", "map-stability.js",
    "map-node-position-fix.js", "map-stability.css", "map-node-position-fix.css", "map-app-loader.js",
    "assets/index-Cv5KdO45.css", "assets/index-j2Su3uB2.js",
    "courseware/archives-ruijin.json", "courseware/archives-yudu.json",
    "scenes/ruijin/index.html", "scenes/yudu/index.html",
]

fetched = {}
queue = list(seeds)
bad = []
sess = requests.Session()

def norm(p):
    p = p.split("?")[0].split("#")[0].strip().replace("\\", "/")
    if not p:
        return None
    if p.startswith("http"):
        return None
    pref = "/api/program-assets/754/t/" + TOKEN + "/"
    if p.startswith(pref):
        p = p[len(pref):]
    elif p.startswith("/api/"):
        return None
    return p

while queue:
    path = queue.pop(0)
    if path in fetched or path in bad:
        continue
    if path.count("/") > 12 or len(path) > 240:
        bad.append(path)
        continue
    try:
        r = sess.get(BASE + requests.utils.quote(path, safe="/:?=&%"), headers=H, timeout=120)
    except Exception as e:
        bad.append(path + " EXC")
        continue
    if r.status_code != 200:
        bad.append(path)
        continue
    dest = os.path.join(SITE, path.replace("/", os.sep))
    d = os.path.dirname(dest)
    if d:
        os.makedirs(d, exist_ok=True)
    open(dest, "wb").write(r.content)
    fetched[path] = (len(r.content), r.headers.get("content-type", ""))
    if not path.lower().endswith(TEXTISH):
        continue
    txt = r.content.decode("utf-8", "ignore")
    cands = set()
    for m in re.finditer(r"['\"]([^'\"\s<>]{2,240})['\"]", txt):
        s = m.group(1)
        if s.lower().endswith(ASSET_EXT):
            cands.add(s)
    for m in re.finditer(r"url\(\s*['\"]?([^'\")]+)", txt):
        cands.add(m.group(1).strip())
    for m in re.finditer(r"(?:src|href|data-src|poster)\s*=\s*[\"']([^\"']+)", txt, re.I):
        cands.add(m.group(1))
    for s in cands:
        n = norm(s)
        if not n:
            continue
        if n.startswith(("./", "../")):
            rootc = n.lstrip("./").lstrip("../")
            if rootc:
                queue.append(rootc)
            dirc = posixpath.normpath(posixpath.join(posixpath.dirname(path), n))
            if not dirc.startswith(".."):
                queue.append(dirc)
        else:
            queue.append(n)

print("fetched", len(fetched), "bad", len(bad))
json.dump({"fetched": fetched, "bad": bad}, open(os.path.join(OUT, "crawl2.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
tot = sum(v[0] for v in fetched.values())
print("total bytes", tot)
for p, (n, c) in sorted(fetched.items()):
    print(n, c, p)
