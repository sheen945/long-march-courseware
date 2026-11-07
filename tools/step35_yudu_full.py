# -*- coding: utf-8 -*-
"""按 chapter_yudu.json 依赖树完整拉取于都章节资源"""
import json, os, re, requests

OUT = r"D:\daima\rea-aifuneng\recon"
SITE = r"D:\daima\rea-aifuneng\site"
ROOT = "scenes/yudu/"
lease = json.load(open(os.path.join(OUT, "lease.json"), encoding="utf-8"))
BASE = lease["base"]
H = {"User-Agent": "Mozilla/5.0 Chrome/156.0", "Referer": "https://aifunengjiaoyu.com/"}

PAT = re.compile(r"^(?:\./)?(?:assets/|data/|src/)[^\s\"']*\.(?:webp|jpg|jpeg|png|mp3|mp4|json|svg|glb|ktx2|hdr)$")
queue, seen, failed = [], set(), []

def norm_ref(ref):
    ref = ref.strip().lstrip("./")
    return ROOT + ref

def fetch(p):
    if p in seen:
        return None
    seen.add(p)
    r = requests.get(BASE + requests.utils.quote(p, safe="/:"), headers=H, timeout=180)
    if r.status_code != 200:
        failed.append((r.status_code, p))
        return None
    d = os.path.join(SITE, p.replace("/", os.sep))
    os.makedirs(os.path.dirname(d), exist_ok=True)
    open(d, "wb").write(r.content)
    print(r.status_code, len(r.content), p)
    return r

# 起点：章节清单
root_json = SITE + r"\scenes\yudu\data\chapter_yudu.json"
text = open(root_json, encoding="utf-8").read()
for m in re.finditer(r"\"([^\"]+)\"", text):
    s = m.group(1)
    if PAT.match(s):
        queue.append(norm_ref(s))

while queue:
    p = queue.pop(0)
    r = fetch(p)
    if r is not None and p.endswith(".json") and len(r.content) < 6_000_000:
        t = r.content.decode("utf-8", "ignore")
        for m in re.finditer(r"\"([^\"]+)\"", t):
            s = m.group(1)
            if PAT.match(s):
                queue.append(norm_ref(s))
        # 有时直接写文件名（如同目录 xxx.webp）
        for m in re.finditer(r"\"([^\"/\\]+\.(?:webp|jpg|jpeg|png|mp3|mp4))\"", t):
            s = m.group(1)
            sub = p.rsplit("/", 1)[0] + "/" + s
            queue.append(sub)
print("failed:", failed)
