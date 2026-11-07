# -*- coding: utf-8 -*-
"""从包装页中抽出真正的课件 HTML，并去掉平台锁/授权校验，生成本地可运行版本"""
import json, os, re, shutil

SITE = r"D:\daima\rea-aifuneng\site"
BUILD = r"D:\daima\rea-aifuneng\dist"

def take_literal(t):
    """定位 longMarchSaveClient(config, "<escaped html>") 里的 html 字符串"""
    idx = t.find("longMarchSaveClient(")
    if idx < 0:
        return None, None
    mark = t.find("\\u003c", idx)
    if mark < 0:
        return None, None
    i = mark
    while i > 0:
        i -= 1
        if t[i] == '"':
            j, n = i - 1, 0
            while j >= 0 and t[j] == "\\":
                n += 1
                j -= 1
            if n % 2 == 0:
                break
    start = i
    j = mark
    while j < len(t):
        if t[j] == '"':
            m, n = j - 1, 0
            while m >= 0 and t[m] == "\\":
                n += 1
                m -= 1
            if n % 2 == 0:
                break
        j += 1
    lit = t[start:j+1]
    cfg_start = t.find("{", idx)
    cfg_txt = t[cfg_start:start-2].rstrip().rstrip(",")
    try:
        cfg = json.loads(cfg_txt)
    except Exception:
        cfg = None
    return json.loads(lit), cfg

HOST_BLOCK_RE = re.compile(r"<script>\s*\(function\(\).*?x\.send\(\);?\}\)\(\);?\s*</script>", re.S)
DEVTOOLS_RE = re.compile(r"<script>\s*\(function\(\)\s*\{\s*//\s*防右键.*?</script>", re.S)

def remove_script_containing(html, needle, note):
    k = html.find(needle)
    if k < 0:
        return html
    a = html.rfind("<script", 0, k)
    b = html.find("</script>", k)
    if a < 0 or b < 0:
        return html
    return html[:a] + "<script>/*[REA] " + note + "*/</script>" + html[b + len("</script>"):]

def patch(html, base="./"):
    # 1) 去掉宿主白名单 + verify-access 校验脚本
    html = remove_script_containing(html, "new XMLHttpRequest", "平台锁与授权校验已移除，可本地运行")
    # 2) 去掉调试器检测/快捷键屏蔽
    html = remove_script_containing(html, "防右键", "devtools 检测与快捷键屏蔽已移除")
    # 3) 重写 base
    html = re.sub(r"<base[^>]*>", '<base href="%s">' % base, html)
    return html

targets = {
    "index.html": ("index.html", "./"),
    "scenes/ruijin/index.html": ("scenes/ruijin/index.html", "./"),
    "scenes/yudu/index.html": ("scenes/yudu/index.html", "./"),
}

os.makedirs(BUILD, exist_ok=True)
shutil.copytree(SITE, BUILD, dirs_exist_ok=True)
report = {}
for rel, (src, base) in targets.items():
    p = os.path.join(SITE, src)
    t = open(p, encoding="utf-8").read()
    inner, cfg = take_literal(t)
    if inner is None:
        print("跳过（无包装）:", src)
        continue
    out = patch(inner, base)
    d = os.path.join(BUILD, os.path.dirname(rel))
    os.makedirs(d, exist_ok=True) if d else None
    open(os.path.join(BUILD, rel), "w", encoding="utf-8").write(out)
    report[rel] = {"cfg": cfg, "in_len": len(inner), "out_len": len(out)}
    print(rel, "cfg keys:", list((cfg or {}).keys())[:8], "in", len(inner), "out", len(out))

json.dump(report, open(os.path.join(BUILD, "_build_report.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
