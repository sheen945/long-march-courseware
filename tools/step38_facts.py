# -*- coding: utf-8 -*-
"""汇总事实清单，供报告引用"""
import json, os, re

SITE = r"D:\daima\rea-aifuneng\site"
DIST = r"D:\daima\rea-aifuneng\dist"
facts = {}

# 1) AM 覆盖表（章节 -> 场景入口/预览图）
t = open(os.path.join(SITE, "assets/index-j2Su3uB2.js"), encoding="utf-8").read()
i = t.find("const AM=")
seg = t[i:i+4000]
keys = re.findall(r'(\w+):\{scenePath:"([^"]+)",previewImage:(?:"([^"]*)"|([\w.]+))\}', seg)
facts["scene_overrides"] = [{"id": k, "scene": s, "preview": (p[:40] + "…") if len(p) > 40 else p} for k, s, p, _ in keys]

# 2) 地图节点
i = t.find('function y1(')
seg2 = t[i:i+3000]
nodes = re.findall(r'y1\("(\w+)","([^"]+)","([^"]+)",([\d.]+),([\d.]+),"([^"]+)","([^"]*)"', seg2)
facts["map_nodes"] = [{"id": a, "name": b, "sub": c, "lon": float(d), "lat": float(e), "date": f} for a, b, c, d, e, f, g in nodes]
facts["route_segments"] = sorted(set(re.findall(r'"(\w+->\w+)":\[', t[i:i+4000])))

# 3) 章节标题卡
try:
    tt = open(os.path.join(SITE, "shared-ui/chapter-titlecard.js"), encoding="utf-8").read()
    facts["titlecard_titles"] = re.findall(r"title:\s*[\"']([^\"']+)[\"']", tt)[:20]
except Exception as e:
    facts["titlecard_titles"] = str(e)

# 4) 站点/产物统计
def stats(d):
    n, b = 0, 0
    for r, _, f in os.walk(d):
        for x in f:
            n += 1
            b += os.path.getsize(os.path.join(r, x))
    return {"files": n, "mb": round(b / 1048576, 1), "biggest": []}

for key, d in (("site", SITE), ("dist", DIST)):
    s = stats(d)
    items = []
    for r, _, f in os.walk(d):
        for x in f:
            items.append((os.path.getsize(os.path.join(r, x)), os.path.relpath(os.path.join(r, x), d).replace("\\", "/")))
    s["biggest"] = [{"mb": round(a / 1048576, 2), "p": p} for a, p in sorted(items)[-6:]]
    facts[key] = s

# 5) 章节数据
for p, name in ((os.path.join(SITE, "scenes/ruijin/assets/chapter.json"), "chapter_json_ruijin"),
                (os.path.join(SITE, "scenes/yudu/data/chapter_yudu.json"), "chapter_json_yudu")):
    try:
        d = json.load(open(p, encoding="utf-8"))
        facts[name] = {"keys": list(d.keys()), "title": d.get("title"), "scenes": list(d.get("scenes", {}).keys()) if isinstance(d.get("scenes"), dict) else d.get("sceneFiles")}
    except Exception as e:
        facts[name] = str(e)

json.dump(facts, open(r"D:\daima\rea-aifuneng\recon\facts.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps(facts, ensure_ascii=False, indent=1)[:3000])
