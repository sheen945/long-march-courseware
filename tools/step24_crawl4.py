# -*- coding: utf-8 -*-
"""v4：以本地已落地文件为源，反复扫描并补齐缺失引用"""
import json, os, re, requests, posixpath

OUT = r"D:\daima\rea-aifuneng\recon"
SITE = r"D:\daima\rea-aifuneng\site"
lease = json.load(open(os.path.join(OUT, "lease.json"), encoding="utf-8"))
BASE, TOKEN = lease["base"], lease["token"]
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/156.0 Safari/537.36",
     "Referer": "https://aifunengjiaoyu.com/"}

TEXTISH = (".html", ".js", ".mjs", ".css", ".json", ".svg", ".txt", ".map")
ASSET_EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".mp3", ".mp4", ".webm", ".wav", ".ogg",
             ".m4a", ".json", ".js", ".css", ".html", ".glb", ".gltf", ".ktx2", ".bin", ".hdr", ".env",
             ".ttf", ".otf", ".woff2", ".woff", ".txt", ".data", ".ktx", ".basis", ".webmanifest", ".xml",
             ".avif", ".jfif", ".ico", ".patt", ".mpga")

def unescape(s):
    return (s.replace('\\"', '"').replace("\\'", "'").replace("\\u003c", "<").replace("\\u003e", ">")
             .replace("\\u0026", "&").replace("\\/", "/").replace("\\n", "\n").replace("\\\\", "\\"))

def norm(p):
    p = p.split("?")[0].split("#")[0].strip().replace("\\", "/")
    if not p or p.startswith("http") or p.startswith("data:") or p.startswith("#"):
        return None
    pref = "/api/program-assets/754/t/" + TOKEN + "/"
    if p.startswith(pref):
        p = p[len(pref):]
    elif p.startswith("/api/"):
        return None
    return p

sess = requests.Session()
bad = set()
fetched = set()
for root, _, files in os.walk(SITE):
    for fn in files:
        fetched.add(os.path.relpath(os.path.join(root, fn), SITE).replace("\\", "/"))

rounds = 0
while True:
    rounds += 1
    candidates = set()
    for root, _, files in os.walk(SITE):
        for fn in files:
            if not fn.lower().endswith(TEXTISH):
                continue
            p = os.path.join(root, fn)
            txt = unescape(open(p, encoding="utf-8", errors="ignore").read())
            d = posixpath.dirname(os.path.relpath(p, SITE).replace("\\", "/"))
            refs = []
            for m in re.finditer(r"(?:src|href|poster)\s*=\s*[\"']([^\"']+)", txt, re.I):
                refs.append(m.group(1))
            for m in re.finditer(r"url\(\s*[\"']?([^'\")]+)", txt):
                refs.append(m.group(1).strip())
            for m in re.finditer(r"['\"]([^'\"\s<>]{2,240})['\"]", txt):
                s = m.group(1)
                if s.lower().endswith(ASSET_EXT):
                    refs.append(s)
            for s in refs:
                n = norm(s)
                if not n:
                    continue
                if n.startswith(("./", "../")):
                    dirc = posixpath.normpath(posixpath.join(d, n))
                    if not dirc.startswith(".."):
                        candidates.add(dirc)
                    rootc = n.lstrip("./").lstrip("../")
                    if rootc:
                        candidates.add(rootc)
                else:
                    candidates.add(posixpath.normpath(n))
                    if not n.startswith("/"):
                        dirc = posixpath.normpath(posixpath.join(d, n))
                        if not dirc.startswith(".."):
                            candidates.add(dirc)
    need = sorted(c for c in candidates if c not in fetched and c not in bad and c.count("/") <= 12)
    print("round", rounds, "need", len(need))
    if not need or rounds > 12:
        break
    got = 0
    for path in need:
        if path in fetched:
            continue
        r = sess.get(BASE + requests.utils.quote(path, safe="/:?=&%"), headers=H, timeout=120)
        if r.status_code != 200:
            bad.add(path)
            continue
        dest = os.path.join(SITE, path.replace("/", os.sep))
        d2 = os.path.dirname(dest)
        if d2:
            os.makedirs(d2, exist_ok=True)
        open(dest, "wb").write(r.content)
        fetched.add(path)
        got += 1
    print("  downloaded", got)

total = 0
for root, _, files in os.walk(SITE):
    for fn in files:
        total += os.path.getsize(os.path.join(root, fn))
print("files", len(fetched), "bytes", total, "bad", len(bad))
json.dump({"files": sorted(fetched), "bad": sorted(bad)},
          open(os.path.join(OUT, "crawl4.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("---- bad ----")
print("\n".join(sorted(bad)))
