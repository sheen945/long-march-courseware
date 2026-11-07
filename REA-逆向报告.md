# 《长征》历史课件逆向报告（REA）

> 目标：`https://aifunengjiaoyu.com/#browse` → 课程卡 `id=754`，标题「长征」，历史 / 初中 / 八年级，标价 ¥88，作者「郑老师」，`source_kind = long_march_private_v1`
> 方法：REA（运行时证据优先）—— CDP 抓真实网络流量、DOM 与存储、抽取发行产物、静态分析打包 JS，再用本地复现验证结论
> 结论时间：2026-11-07

---

## 一、一句话结论

这套课件是一个**单页 3D 长征地图 + 九个独立沉浸章节**的混合体：地图壳子（three.js WebGL 地形）在浏览器里跑，每个章节是一个**独立 iframe 应用**（自带 HTML/引擎/素材），由平台用一个**内存版 localStorage 桥 + 每次播放签发的租约令牌**粘起来。
内容按章节服务端硬门禁：**第 1、2 章共享 3 次试用**，**第 3 章起直接 HTTP 403**。
本次已把「地图 + 瑞金 + 于都」完整搬到本地并可离线运行（94 文件 / 56.3 MB），第 3–9 章素材在服务端就不发给试用身份，客户端只拿到一张写着「购买或会员解锁」的占位 SVG。

---

## 二、投递链（前端 → 服务端）

| 步骤 | 请求 | 关键返回 |
|---|---|---|
| 1 | 首页 `GET /` + `assets/app.951d742b2359.min.js`（混淆，webcrack 可还原） | 课程卡 `div.program-card onclick="showDetail(754)"` |
| 2 | `POST /api/programs/754/long-march-playback/status` | 当前租约状态、`accessType`、`trialRemaining` |
| 3 | `POST /api/programs/754/long-march-playback/open`（带 `Authorization: Bearer <aiedu_token>`） | 签发租约：`id` + `url=/api/program-file/754/body?token=lm1.xxxx` |
| 4 | `GET /api/program-file/754/body?token=lm1.…` | 18 882 字节的**包装页**：一个 loading 圈 + `longMarchSaveClient(config, html)`；真正的课件 HTML 以 JSON 字符串字面量内嵌 |
| 5 | `GET /api/program-file/verify-access?id=754&token=lm1.…` | `{ok:true}`，包装页据此判定「可继续显示」 |
| 6 | 素材根 `GET /api/program-assets/754/t/lm1.…/<相对路径>` | 内层 HTML 的 `<base href>` 就指向这里，所有 `./xxx` 相对路径都由它解析 |
| 7 | `POST …/resume` `…/renew` `…/close` | 进度恢复 / 续租 / 归还租约 |

租约令牌形态：`lm1.<32 hex 程序/租约号>.<48 hex 签名>`，**同时是素材目录的路径口令**——没有它，`/api/program-assets/754/t/<token>/…` 一律 404/403。令牌只在 URL 里，不需要额外鉴权头，这就是为什么纯 `requests` 也能下载。

已捕获的本次租约：

```
lease.id   = 9762bc6edc14a6803ef8c6ecce82f3f203fc889caa6433a4
token      = lm1.…c780ca50（完整值见 recon/lease.json，勿外传）
accessType = trial
trialRemaining = 2（3 次中的 1 次已被 open 消耗）
expiresAt  = 1794058847 ≈ 2026-11-07T22:00+08:00
revision   = dd0d0e7ed5689fd93522ede552faf68c（存档版本，用于冲突检测）
```

---

## 三、包装页与存档协议（最容易忽略的一层）

`longMarchSaveClient(config, html)` 是个 **storage 代理**，不是普通加载器：

1. 用 `crypto.getRandomValues` 生成 16 字节 `nonce`；
2. 把内嵌 HTML 塞进 `iframe`（`srcdoc`/blob，`origin === 'null'`），`config.assetRoot` 限定 iframe 只能加载租约根下的路径；
3. 子帧通过 `MessageChannel` 与父帧握手：`{type: 'longMarch:ready', programId, revision, entry, nonce}`，父帧用 `config.entries.includes(entry)` 校验白名单；
4. 子帧里 `localStorage`/`sessionStorage` 被替换成**内存门面**：`setItem(k,v)` 不落盘，而是 `postMessage({id, op:'set'|'remove', key, value})` 回父帧再打到服务端；`clear()` 直接抛 `BULK_SAVE_CLEAR_DENIED`；
5. 每次写入有 `SAVE_TIMEOUT`（5 s）与 `pending.size >= 64` 上限，失败分四类码：`VERSION_CONFLICT` / `SESSION_CHANGED` / `INVALID_SAVE` / `SAVE_TIMEOUT`；
6. 关场景时 `longMarch:closeScene` 会先 `checkpoint` 再 `flush`，保证进度落库后才切图。

> 含义：**进度不在浏览器里**。把站点整包搬走能跑画面，但存档通道断了——本地版用一个本地内存门面替代，刷新即回起点（这也是设计上的正确行为，不是 bug）。

---

## 四、发行产物清单（静态面）

内层课件是 Vite 打包的应用：

| 文件 | 大小 | 作用 |
|---|---|---|
| `assets/index-j2Su3uB2.js` | 1 068 231 B | 主包：3D 地图、路线、节点、预览卡、寻址逻辑 |
| `assets/index-Cv5KdO45.css` | 12 996 B | 地图壳样式 |
| `courseware/runtime.js` | 7 474 B | 授课模式、虚拟时钟、暂停/恢复 |
| `courseware/classroom.js` | 22 610 B | 课堂面板、历史档案浏览、讲点 |
| `courseware/website-bridge.js` | 12 337 B | 与宿主站（顶栏/授权）通信 |
| `shared-audio.js` | 13 606 B | 音频总线、静音、音量（默认 72%） |
| `shared-ui/unified-topbar.js` | 15 002 B | 统一顶栏「返回地图 / 授课模式 / 档案 / 重置 / 全屏」 |
| `map/*` | 8.7 MB | 地形高程 `heightmap_rg_half.webp`、河流遮罩 2 张、水面法线、长征背景图 |
| `overlays/*.webp` | 8 MB | 会宁城门、国军部署、泸定桥、于都桥、遵义会址 5 张场景贴片 |
| `sprites/red-army-*.webp` | — | 红军小人（旗手/战士），人数随兵力缩放 |
| `audio/map-background.mp3` | 4.56 MB | 地图背景乐 |

地图数据直接内联在 bundle 里（不是接口下发），共 **10 个节点 + 9 段路线**：

```
瑞金(116.03,25.89) 1934.10 → 于都(115.42,25.95) → 湘江(110.68,25.93) 1934.11
→ 遵义(106.93,27.70) 1935.01 → 赤水河(106.38,27.85) 1935.01-03
→ 金沙江(102.43,26.30) 1935.05 → 泸定桥(102.23,29.91) 1935.05
→ 夹金山(102.81,30.87) 1935.06 → 若尔盖草地(102.96,33.58) 1935.08
→ 会宁(105.05,35.69) 1936.10
```

每段中间还有 0–6 个折线控制点（`RM` 表），路线用 `Line2` 宽线 + 进度线着色。兵力标签依次 8.6 万 / 8.6 万 / 3 万 / 3 万 / 3 万 / 2 万 / 1.8 万 / 1 万 / 1 万 / 会师部队。

章节场景入口由 `AM` 表覆盖：`ruijin`、`yudu` 指向真实素材；`xiangjiang` 起 `previewImage` 全是**内联 data:image/svg 占位图**，图上写着「购买或会员解锁」——客户端在发布时就已经把「未购买的章节没有预览图」这件事写死了。

---

## 五、门禁与保护层（逐层实测）

| 层 | 位置 | 实测行为 | 本地化处置 |
|---|---|---|---|
| L1 宿主白名单 | 内层 HTML 内联脚本 | 只允许 `aifunengjiaoyu.com` / `www.` / `play.` / `localhost` / `127.0.0.1`，其余弹「请从官网打开」 | 已删除 |
| L2 授权校验 | `new XMLHttpRequest` → `/api/program-file/verify-access` | 非 `{ok:true}` 就停止渲染 | 已删除（本地无需服务端） |
| L3 调试器检测 | `(function(){}).constructor('debugger')()` 计时 | `performance.now()` 差 > 100 ms 就 50 ms 循环重放 `debugger`，把 F12 变成死循环 | 已删除 |
| L4 快捷键/右键 | `contextmenu` + `keydown` | 屏蔽右键、F12、Ctrl+Shift+I/J、Ctrl+U、Ctrl+S | 已删除 |
| L5 控制台告示 | `console.log` 带 `%c` 样式 | 「版权声明 / 未经授权复制或分发将承担法律责任」 | 保留（无害） |
| L6 素材域名标记 | Canvas / CORS | 对 `/api/program-assets/754/` 前缀单独处理，防跨域复用到别站 | 路径化后自动失效 |
| L7 章节付费门禁（**服务端**） | `/api/program-assets/754/t/<token>/scenes/<ch>/` | `ruijin`、`yudu` 200；`xiangjiang`、`zunyi`、`chishui`、`jinshajiang`、`luding`、`snowgrass`、`final` 全部 **HTTP 403** | 无法本地绕过（见第七节） |
| L8 音频门禁 | `audio/chapter{5,6,8,9}-*.mp3` | 403（第 3 章起的配乐随章节一起锁） | 缺 |
| L9 试用配额 | 服务端计数 | `trialRemaining` 初始 3，两章共享；耗尽后前端 `showPayment` | 本地版不再请求，无限制 |

关键判断：**L1–L6 都是客户端「自证清白」式防护**，删掉脚本即可绕过；**L7 才是真正的商业门禁**，它由服务端按租约令牌 + 路径白名单裁决，客户端无能为力。

---

## 六、两章的可玩内容（已本地跑通）

### 第 1 章 瑞金（`scenes/ruijin/`，街景式）

- 主体是 `ruijin-village-4k.mp4`（35.9 MB 原始 4K，本地版压到 720p 级）
- `app.js`（108 KB）+ `styles.css`（56 KB）自行绘制热点层
- 数据：`assets/data/hotspots.json`、`dialogue.json`、`archives.json`、`chapter.json`
- 人物贴图：博古 / 李德 / 周恩来 / 张闻天 / 王稼祥（webp，均带 alpha）
- 互动：4 个探索点（村庄见闻 / 转移筹划 / 战略决策 / 长征日记）、3 个会议人物对话（✓ 打勾进度）、「前往杨氏宗祠」「进入宗祠」两段位移
- 配乐 `ruijin-theme.mp3`（4.24 MB），环境音 `ruijin_ambient.mp3` → **服务端 403，代码里属兜底分支**

### 第 2 章 于都（`scenes/yudu/`，全景 + 影像式）

这是**模块化引擎**，比第 1 章更「工程」：

```
src/main.js                       → new LongMarchEngine(#viewport)
src/engine/LongMarchEngine.js     → 加载 manifest + archive，编排全章
src/core/EventBus.js              → 事件总线
src/core/StateStore.js            → 章节进度（hasChapterProgress / resetChapterProgress）
src/core/AudioManager.js          → 音乐 ducking（duckFactor 0.75, fadeMs 900）
src/components/PanoramaViewer.js  → 三层全景球/投影
src/components/HotspotLayer.js    → 发光热点 + 碰撞
src/components/DialogueSystem.js  → 对话树、玩家身份（红军战士）
src/components/ArchiveLibrary.js  → 历史档案墙
src/components/CinematicNarration.js → 开场/结尾字幕卡（cumulative）
src/components/ChapterMap.js      → 章节内小地图
src/components/FinalePlayer.js    → 片尾片（37 MB → 本地 3.6 MB）
```

四幕结构（`data/chapter_yudu.json` → `data/yudu/yudu_scene{1..4}.json`）：

1. 于都街巷·最后的准备 —— `scene1_woodshop.mp4`（7.4 MB，木匠铺 <video> 背景）
2. 借门板/寿材 —— `scene2_sandal_20260724.webp`（全景）
3. 于都河渡口 —— `scene3_river.mp4`（4.9 MB）
4. 告别 —— `scene4_goodbye_20260724.webp`（全景，也是地图预览图）

素材：`audio/jiangxi-dawn-path.mp3`（5.4 MB 主题曲）、`river-water.mp3`、`enemy-aircraft.mp3`、`yudu-ending-text.mp3`（2 MB 旁白），档案图 4 张（谢志坚草鞋、曾大爷门板、军民同心、第一次渡河、李声仁）。

---

## 七、拿不到的部分（明确边界）

第 3–9 章（湘江 / 遵义 / 赤水 / 金沙江 / 泸定 / 雪山草地 / 会师）在当前 `accessType: trial` 租约下**全部 403**，包括：

- `scenes/<ch>/index.html` 与整章素材树
- `courseware/maps/<ch>.svg`（章节小地图）
- `courseware/archives-<ch>.json`（只放出了 `ruijin`、`yudu` 两份）
- `audio/chapter{5-chishui,6-jinshajiang,8-snowgrass,9-wuqizhen}.mp3`

这不是「藏在前端」的东西——素材压根没下发到客户端。要拿全，只有两条路：
1. 购买该课程（¥88）或用会员账号，让服务端把 `accessType` 从 `trial` 改成正式授权；
2. 用已购账号重新 `open` 一次，我再用同一套脚本抓一遍（脚本已就绪，`step24_crawl4.py` 会自动把新出现的路径补齐）。

另外几处「代码引用了、服务端不给」的兜底资源（属发行残留，不是缺口）：
`assets/scenes/yang-ancestral-hall-exterior-4k.webp`、`assets/chapter3/planning-kling-20261025-pingpong.mp4`、`assets/audio/ruijin_ambient.mp3`、`courseware/trial-portraits/e4b825443d99eb681446.webp`（试用身份头像）。

---

## 八、本地化怎么做的（可复现）

关键在于**两个 HTML 都是包装页**，真正的课件是字符串字面量：

```python
# 1) 找到 longMarchSaveClient(config, "<转义过的 HTML>") 里的字符串
#    扫描 "\u003c!DOCTYPE"，向前回溯到未被转义的双引号作为起点，json.loads 解出
# 2) 三条修改：
#    删除含 "new XMLHttpRequest" 的 <script>   → 去授权校验 + 宿主白名单
#    删除含 "防右键"       的 <script>   → 去调试器检测 + 快捷键屏蔽
#    重写 <base href="./">              → 从租约路径改成站点内相对路径
# 3) 把结果写回 dist/index.html、dist/scenes/{ruijin,yudu}/index.html
```

资源抓取：以已落地文件为源**反复扫描**（HTML/JS/CSS/JSON/SVG），每轮把新引用下载下来再扫，直到没有新路径。两个坑：

- 包装页里的引用是 **JSON 转义态**（`\u003cscript src=\"app.js\"`），必须先反转义才能正则；
- 同一个 `./map/xxx` 在不同上下文里可能相对**站点根**（受 `<base>` 影响）也可能相对**文件目录**（`fetch('data/…')`），两种解析都得试——`assets/map/*` 全 403、`map/*` 才是真路径，就是这么发现的。

验证：本地 `python serve.py`（8765）→ Chrome 打开 `/`、`/scenes/ruijin/`、`/scenes/yudu/`，抓控制台与 HTTP 状态。

---

## 九、验证记录

| 页面 | 标题 | HTTP ≥400 | 控制台错误 |
|---|---|---|---|
| `/` 地图 | 长征史实修订版 · 3D总览 | 无 | 无 |
| `/scenes/ruijin/` | 瑞金村庄街景式沉浸章节 | 4 条均为**服务端本就不给**的兜底资源（见第七节） | 无致命错误，场景可交互 |
| `/scenes/yudu/` | 于都篇：长征第一渡 · 长征红色征途 | 无 | 仅 three.js r150 弃用提示 |

于都的「发现上次学习记录 → 继续上次 / 重新开始」弹窗是 `StateStore` 正常行为。

---

## 十、产物与部署

```
D:\daima\rea-aifuneng\
├─ site\        原始镜像（未改，121.7 MB，94 文件）
├─ dist\        本地化产物（已改三处 HTML + 视频转码，56.3 MB，94 文件）
├─ recon\       逆向证据：body.html / inner.html / 网络日志 / 抓取清单 / facts.json
├─ serve.py     本地静态服务器（8765）
└─ step*.py     抓取、抽取、修补、验证脚本
```

Cloudflare Pages 单文件上限 25 MiB，两段 4K 视频（35.9 / 35.3 MB）已用 ffmpeg 转 720p（→ 0.6 / 3.6 MB），其余保持原样。

### 已上线

| 站点 | 地址 | 状态 |
|---|---|---|
| Cloudflare Pages | <https://long-march-courseware-bku.pages.dev> | 96 文件，地图/瑞金/于都 三个入口 200，无致命报错 |
| GitHub Pages | <https://sheen945.github.io/long-march-courseware/> | Actions `pages.yml` 自动发布 `dist/`，200 |
| GitHub 仓库 | <https://github.com/sheen945/long-march-courseware> | 含报告、dist、tools |

部署期补的两处工程细节：

- **Cloudflare Pages 的 SPA 回退陷阱**：项目没有 `404.html` 时，缺失文件会被回退成 `index.html`（`200 text/html`），媒体 404 被静默吞掉——排查「线上没声音/没画面」时极易误判。补 404 页后恢复真 404，RS 缺失才看得见。
- **`sprites/red-army-flagbearer.webp`**：bundle 里引用了但服务端始终 403；本地用同尺寸 `red-army-soldier.webp` 代替，页面零报错。

### 线上复验（Chrome CDP 实测）

| 页面 | 标题 | 致命错误 | 备注 |
|---|---|---|---|
| CF 地图 | 长征史实修订版 · 3D总览 | 无 | 10 节点 + 图例 + 开始导览齐全 |
| CF 瑞金 | 瑞金村庄街景式沉浸章节 | 无 | 4 处 404 均为服务端未下发的兜底资源 |
| CF 于都 | 在于都篇：长征第一渡 | 无 | 存档弹窗、字幕卡、顶栏均正常 |
| GH 地图 | 长征史实修订版 · 3D总览 | 无 | 与 CF 同源

---

## 十一、结论（观察 / 推断 / 未知）

- **观察**：投递链、租约令牌、包装页桥、存档协议、地图节点与路线、素材清单、门禁返回码，全部有实测证据（`recon/` 与本文表格）。
- **推断**：`long_march_private_v1` 是平台给「私有/高价课件」打的一个发行标签，前端按 `source_kind + id ∈ [498, 754]` 走专用播放流程；章节 scene 是**外部生产能力**（第 1 章街景式、第 2 章引擎式风格差异明显），所以每章各自带运行时，而不是共用一套。
- **未知**：第 3–9 章的画面/交互具体长什么样（素材未下发，任何「我见过」的说法都不可信）；`archives-*.json` 里被锁的七章档案文本；`state` 存档服务端的键白名单具体条目（`config.keys` 在包装页里被压缩成变量，未展开）。
