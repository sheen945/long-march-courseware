# -*- coding: utf-8 -*-
"""打开站点 -> 抓全部网络请求 -> 存 DOM/脚本/存储"""
import json, os, time
from playwright.sync_api import sync_playwright

OUT = r"D:\daima\rea-aifuneng\recon"
os.makedirs(OUT, exist_ok=True)

URL = "https://aifunengjiaoyu.com/#browse"
records = []

def on_request(req):
    try:
        records.append({
            "phase": "req",
            "t": round(time.time(), 3),
            "method": req.method,
            "url": req.url,
            "rt": req.resource_type,
            "post": (req.post_data or "")[:2000],
        })
    except Exception as e:
        pass

def on_response(resp):
    try:
        ct = resp.headers.get("content-type", "")
        records.append({
            "phase": "resp",
            "t": round(time.time(), 3),
            "status": resp.status,
            "url": resp.url,
            "ct": ct,
            "len": resp.headers.get("content-length", ""),
        })
    except Exception:
        pass

def on_ws(ws):
    records.append({"phase": "ws", "url": ws.url})

with sync_playwright() as pw:
    b = pw.chromium.connect_over_cdp("http://127.0.0.1:9222")
    ctx = b.contexts[0]
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    ctx.on("request", on_request)
    ctx.on("response", on_response)
    ctx.on("websocket", on_ws)
    page.goto(URL, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(8000)
    print("TITLE:", page.title())
    print("URL:", page.url)
    # 尝试点击"浏览"入口
    page.screenshot(path=os.path.join(OUT, "01_initial.png"), full_page=False)
    html = page.content()
    open(os.path.join(OUT, "dom.html"), "w", encoding="utf-8").write(html)
    print("HTML len", len(html))
    # 列出页面上的可见文本前 3000 字
    print("----TEXT----")
    print(page.inner_text("body")[:3000])
    # localStorage / sessionStorage
    store = page.evaluate("""() => {
        const dump = s => { const o={}; for(let i=0;i<s.length;i++){const k=s.key(i); o[k]=(s.getItem(k)||'').slice(0,300);} return o; };
        return {local: dump(localStorage), session: dump(sessionStorage), cookie: document.cookie};
    }""")
    open(os.path.join(OUT, "storage.json"), "w", encoding="utf-8").write(json.dumps(store, ensure_ascii=False, indent=2))
    print("----STORAGE----")
    print(json.dumps(store, ensure_ascii=False)[:2000])

open(os.path.join(OUT, "network.jsonl"), "w", encoding="utf-8").write(
    "\n".join(json.dumps(r, ensure_ascii=False) for r in records))
print("records", len(records))
