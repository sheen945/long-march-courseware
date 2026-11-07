# 《长征》历史课件 · 本地化重建版

> 来源：`aifunengjiaoyu.com` 课程 `id=754`「长征」（历史 / 初中 / 八年级）
> 本仓库是**逆向研究 + 本地化重建**产物：3D 长征地图壳 + 第 1、2 章（瑞金、于都）完整可离线运行。

## 在线预览

- Cloudflare Pages：<https://long-march-courseware-bku.pages.dev>
- GitHub Pages：<https://sheen945.github.io/long-march-courseware/>

两站内容一致（94 文件 / 56.3 MB）。

## 目录

```
dist/                     可直接部署的静态站点（56.3 MB / 94 文件）
├─ index.html             3D 地图（原包装页的内层 HTML，已去掉平台锁）
├─ assets/                主包 index-j2Su3uB2.js + 样式
├─ map/                   地形高程、河流遮罩、水面法线、背景图
├─ overlays/ sprites/     场景贴片、红军小人
├─ courseware/            运行时、课堂面板、桥接、章节档案
├─ shared-ui/ shared-audio.*
└─ scenes/
   ├─ ruijin/             第 1 章 瑞金（街景式）
   └─ yudu/               第 2 章 于都（全景 + 影像式引擎）
tools/                    抓取 / 抽取 / 修补脚本
REA-逆向报告.md            完整逆向分析（投递链、租约、存档协议、门禁、素材清单）
```

## 本地运行

```powershell
python tools/serve.py          # 默认 http://127.0.0.1:8765
# 或
python -m http.server 8765 --directory dist
```

地图：`/`
第 1 章：`/scenes/ruijin/index.html`
第 2 章：`/scenes/yudu/index.html`

## 部署

```powershell
# Cloudflare Pages
wrangler pages project create long-march-courseware --production-branch main
wrangler pages deploy dist --project-name=long-march-courseware

# GitHub Pages：推 main 分支后，Actions 会自动把 dist/ 发到 Pages
```

## 与原版的差异（均为「能跑」所需，不涉内容改动）

1. 删除 `new XMLHttpRequest` 授权校验脚本（原来会请求 `/api/program-file/verify-access`，并限制宿主域名）
2. 删除 `防右键` 脚本（调试器计时检测 + F12/Ctrl+U/Ctrl+S 屏蔽）
3. `<base href>` 从租约路径改为 `./`；两段 4K 视频转 720p 以满足 Cloudflare Pages 25 MiB 单文件上限
4. **`scenes/ruijin/app.js` 启动链**：`Promise.all(...preloadSceneAssets)` → `Promise.allSettled(...)`。原代码只要有一个转场素材缺失就整体 reject，`video.play()` 永不执行，4K 背景视频停在第一帧——这就是「画面不动、像没有视频」的根因。改后缺失转场降级，主场景视频正常播放。

进度存档：原版走 `MessageChannel` 打到服务端（`revision` 冲突检测），本地版退化为内存态——刷新即回章节起点。

另有两处工程性补齐：

- `dist/404.html`：Cloudflare Pages 在没有 404 页时会把**缺失文件**当 SPA 回退成 `index.html`（200 + HTML），媒体加载失败会被静默吞掉；补 404 页后缺失资源恢复为真 404。
- `sprites/red-army-flagbearer.webp`：原文件在抓取窗口内一直 403（租约到期后不可再取），本地用同尺寸 `red-army-soldier.webp` 代替，页面因此零报错。

## 视频清单（本地实测可播放）

| 文件 | 时长 | 用途 |
|---|---|---|
| `scenes/ruijin/assets/video/ruijin-village-4k.mp4` | 5.09 s（环形） | 第 1 章瑞金村庄全景背景 |
| `scenes/yudu/assets/yudu/scene/scene1_woodshop.mp4` | 4.04 s | 第 2 章第一幕 · 于都街巷木匠铺 |
| `scenes/yudu/assets/yudu/scene/scene3_river.mp4` | 3.07 s | 第 2 章第三幕 · 于都河渡口 |
| `scenes/yudu/assets/yudu/movie_yudu_finale_short.mp4` | 25.0 s | 第 2 章片尾片 |

播放机制：视频元素是 `display:none` 的 `VideoTexture` 源，画面由 three.js 全景球渲染，**不会出现播放器控件**——这不是没加载。

## 未包含

第 3–9 章（湘江 / 遵义 / 赤水 / 金沙江 / 泸定 / 雪山草地 / 会师）素材在服务端按章节付费门禁，试用身份一律 403，客户端从未收到。详见 `REA-逆向报告.md` 第七节。

第 1 章另有 3 个「代码引用了但服务端不给」的资源，导致「前往杨氏宗祠」这条转场点不进去：`assets/scenes/yang-ancestral-hall-exterior-4k.webp`、`assets/chapter3/planning-kling-20261025-pingpong.mp4`、`assets/audio/ruijin_ambient.mp3`。它们同为 403（与付费章节同一签名），试用身份拿不到。
