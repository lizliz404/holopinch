# HoloPinch — 全面 Audit（面向更大观众共鸣）

**Date:** 2026-07-28
**Repo:** `/home/ubuntu/projects/holopinch` → GitHub `lizliz404/holopinch`
**Live:** https://holopinch.lizliz.xyz/ (CF Pages, Git-connected, HTTP 200 ✓)
**审计人:** Jett (Hermes)
**方法:** 全量读源码（8 个 TS/CSS 文件 + index.html + PRD/NOTES/README + RECON）+ 线上实测（curl headers + browser screenshot + OG vision 分析）+ `_templates` 资产盘点

---

## 0. TL;DR — 核心判断

**工程是扎实的，观众回路是断的。**

PRD 里 P0 的功能（continuous flatness continuum、camera+demo 双路、hold/fade、smoothing、三种 shader、guess mode）基本全部兑现，代码质量在这个体量里属于上乘。但从「更大的观众、更深的共鸣」角度看，当前版本是一个**给工程师看的精彩 demo**，还不是一个**给观众看的产品**：

1. **第一眼魔法被仪器面板稀释** — 首屏直接暴露 `span 1.52 · flat 0.91` 遥测、角度标签、标着 "Demo" 的 chip。观众要的是魔法，看到的是仪表。
2. **传播回路缺失** — OG 图无产品画面（vision 判定：elegant but low click motivation）、无分享引导、无录屏。一个为「截图传播」而生的产品，没有任何帮助传播的机制。
3. **移动端 demo 是残的** — 控制依赖 wheel / Shift+wheel，触屏上不存在。viral 流量的大头是手机，手机上 demo 只能拖两个球，open/spread 完全不可控。
4. **可发现性地板没铺完** — 无 robots.txt、无 sitemap、无 JSON-LD、页面零可索引正文（app shell 之外没有任何文字）。
5. **Typography 违反工作区标准** — `font-family: 'Segoe UI', system-ui...` 正是 `_templates/design-typography-font-preferences.md` 明令禁止的 "unbranded browser defaults"。
6. **无归属、无度量** — 没有 lizliz.xyz / GitHub 回链（portfolio 观众白来），没有任何 analytics（PRD §9 的成功指标全部无法测量）。

**杠杆排序：** 修观众回路（P0 1–7）远比加新功能重要。反回声检查见 §7。

---

## 1. 已验证现状（证据表）

| 项 | 状态 | 证据 |
|---|---|---|
| 线上可用 | ✓ 200，title 正确 | `curl -sI` + `<title>HoloPinch — Hold a hologram between your hands</title>` |
| Security headers | ✓ `_headers` 完整（nosniff / DENY / camera=(self) / no-cache+immutable assets） | `public/_headers` |
| 首屏 demo | ✓ 工作（绿色渐变 mesh + 双 orb + 角度标签） | browser screenshot 2026-07-28 |
| Camera 路径 | 未实测真机 | 代码审查 only（MediaPipe CDN lazy load，GPU delegate，hold 400ms + fade 280ms ✓） |
| 初始 JS | 668 KB min / **177 KB gzip** 单 chunk | `dist/assets/index-*.js`（three + tasks-vision 全部打入首包） |
| OG image | ⚠️ 1200×630 但无产品画面 | vision 分析：「abstract logo card, no hand/hologram/UI, weak click motivation」 |
| robots.txt / sitemap | ✗ 不存在 | `dist/` 无此文件 |
| 可索引正文 | ✗ 零 | body 内仅 app shell + 按钮文案 |
| i18n | EN only | PRD 允许 EN 默认 |
| Git 状态 | clean，`main` 已推 | `66bc7fe chore: pin Node 22` |
| PRD P0 | 9/10 ✓（#10 SEO basics 半残：meta ✓ robots/sitemap ✗） | 逐条对照 |
| PRD P1 | 5/7（✗ screen-space stroke width：现在是不受支持的 1px `LineBasicMaterial.linewidth`；✗ share hint 未实现） | `scene.ts:109` |

---

## 2. 观众 × 真实需求 × 现状落差

| 观众 | 真实需求 | 现在得到什么 | 落差 |
|---|---|---|---|
| 短视频/社媒跳转来的路人（最大头） | 5 秒内看到魔法，不用读说明书 | 静态为主的 demo + 遥测行 + "Demo" chip + 角度标签 | **高** — 仪器感 > 魔法感 |
| 手机用户（viral 流量主体） | 能玩、能开摄像头 | 拖球可以；`open`/`spread` 依赖 wheel/Shift+wheel，**触屏无法操作**；camera 真机未验证 | **高** |
| 设计/3D/前端同行 | 看到 craft，能翻源码 | Shade cycle 不错；但无 GitHub 链接、README 无截图 | 中 |
| STEM 教师/孩子 | 角度游戏 | Angles + Guess 都在，但藏在 chip 后面，无人引导发现 | 中 |
| lizliz.xyz 作品集散客 | 这是谁做的、还有什么 | 零归属信息，无回链 | **高**（PRD 受众 #4 完全没服务） |
| 搜索引擎/AI 引用 | 可索引的文字与结构化数据 | app shell 之外零正文，无 JSON-LD | 中 |
| 分享者（截图发推/发群） | 一键出片 | 无 share hint、无录屏、OG 无产品 | **高** |

---

## 3. 分层 Findings（按用户旅程从上至下）

### A. 可发现性（到访之前）

- **A1 无 robots.txt / sitemap.xml。** 单页也要给 crawlers 明确入口。修复：两个静态文件 + `_headers` 已有规则覆盖。
- **A2 零可索引正文。** body 里除了按钮和 status 没有任何文字。Google/AI 引用无法理解这个页面是什么。修复：加一个 `#about` 信息层（`?` 按钮触发 overlay，**HTML 里真实存在的 copy**，不是 JS 注入的不可索引内容——SSR 不需要，直接写在 index.html 里 hidden overlay 即可被索引）。
- **A3 无 JSON-LD。** 加 `WebApplication`（applicationCategory: GameApplication/MultimediaApplication, browserRequirements: camera, offers: free）。
- **A4 title/description 可更贴查询意图。** 现文案不错，但「hold a hologram between your hands」不是任何人的搜索词。可索引 copy 里自然覆盖 "hand tracking hologram browser" / "MediaPipe AR toy" / "pinch gesture WebGL"。

### B. 第一眼（5 秒定生死）

- **B1 遥测行暴露。** `∠ 105° · 75° · 75° · 105° · span 1.52 · flat 0.91` —— `span`/`flat` 是内部调参术语，对观众是纯噪音。修复：默认只保留角度读数（Angles on 时），`span`/`flat` 移到 `?debug=1`。
- **B2 首屏近乎静态。** demo 只有 0.4% 的 breath 浮动。一个「活的全息体」的第一眼应该自己在动。修复（P1）：idle attract loop——用户首次交互前 orb 缓慢漂移、flatness 缓慢呼吸，展示 continuum 两端的形态。
- **B3 "Demo" chip 文案暴露机制。** 观众不需要知道自己处于 "Demo mode"。文案微调即可（status 行说明玩法足够）。
- **B4 角度标签默认开** — 保留（STEM hook 是差异化），但样式可以更细：更小字号、更低透明度、标签背景更轻。不是删，是降噪。

### C. 核心交互回路

- **C1 触屏 demo 残废（最高危）。** `demo.ts` 只有 wheel 监听。修复：触屏手势——单指拖 orb = 手的位置（已有）；双指垂直拖 = pinch open；双指水平拖 = finger spread；status 文案按 `pointer: coarse` 自适应。
- **C2 camera 真机未验证。** PRD kill criteria #1 就是「mid mobile 上 janky」。这次优化后必须在真机过一遍（Hermes 侧验证项，不是 Cursor 的）。
- **C3 WebGL 失败无兜底。** `new THREE.WebGLRenderer` 抛错 = 白屏死。修复：try/catch → 友好错误页（说明 + 重试）。
- **C4 无 `prefers-reduced-motion` 处理。** attract loop / breath 应尊重它。
- **C5 demo orb 无键盘可达性。** arrow keys 移动 focus 的 orb，低成本补。

### D. 传播回路（这个产品存在的意义）

- **D1 OG 图重做（最高杠杆单次改动）。** 现状：黑底 + 双 diamond logo + wordmark，无产品、无文案、无点击动机。修复：真实产品截图（crystal bar 形态最好看）+ 一行 value prop（"Hold a hologram between your hands — no app, just a browser"）。1200×630，Hermes 用本地 dev server + Playwright 截图合成。
- **D2 无 share hint。** PRD P1#7 明确要求。修复：camera 首次出 mesh 后 status 行轮换一句 "Screenshot it — tag #HoloPinch"（无 backend，纯 microcopy）。
- **D3 录屏（P2）。** MediaRecorder 录 canvas+video composite 是 viral 核武器，但 PRD 自己说 "only if trivial"。本轮不做，验证分享回路后再说。
- **D4 twitter:card / og 已有 ✓**，D1 改图即可，标签不用动。

### E. 身份与信任

- **E1 Typography 违规（Liz 点名）。** 现在 `'Segoe UI', ui-sans-serif, system-ui...`。按 `_templates/design-typography-font-preferences.md`：
  - UI/brand → **Inter** 400/600/800（geometric、现代、和全息几何语言匹配）
  - 遥测/角度数字 → **IBM Plex Mono** 400/500（工作区批准的 mono，tabular-nums 已在用）
  - CJK fallback tail 按模板附加，给未来 ZH toggle 留路
  - Google Fonts + `preconnect` + `display=swap`
- **E2 零归属。** About overlay 里加 "Made by Liz — lizliz.xyz" + GitHub repo 链接。portfolio 观众是 PRD 写明的受众 #4。
- **E3 README 太瘦。** 无截图、无 controls 表、无 live badge。补：hero 截图、controls 表、stack、deploy 说明。
- **E4 无 LICENSE。** MIT。
- **E5 favicon ✓**（diamond SVG 和 OG 一致，保留）。

### F. 度量

- **F1 零 analytics。** PRD §9 四个成功指标现在全部不可测。选项：CF Web Analytics（免费、无 cookie，但需要 dashboard/API 开通——Liz 原则是全自动化，走 API 或本轮先跳过并在交付报告里明示）。本轮：**跳过，标记为待决策**（见 §7 kill criteria 需要它）。

### G. 性能

- **G1 177 KB gzip 首包含 MediaPipe。** `hands.ts` 静态 import → tasks-vision 进首包。修复：`enableCamera()` 里 `await import('./hands')`，camera 路径按需加载，首包预计降到 ~150 KB gzip 以内（three 是大头，可接受）。
- **G2 模型/wasm 走 CDN ✓** 懒加载 ✓（点击 Start camera 才拉，合理）。
- **G3 stroke width。** PRD P1#3 要 ≈2% 屏幕高度。`LineBasicMaterial.linewidth` 全平台忽略。真修 = `Line2`/`LineMaterial`（three/examples），改动中等。P1 可选；不做就接受 1px，不算丑。

---

## 4. `_templates` 可借鉴清单

| 资产 | 用在哪 | 怎么用 |
|---|---|---|
| `design-typography-font-preferences.md` | E1 | Inter（UI）+ IBM Plex Mono（数字）+ CJK fallback tail；照抄 stack，不要自创 |
| `_templates/design/lead-radar/DESIGN.md` | About overlay copy 口吻 | "honest positioning copy, research desk not AI dashboard" — About 文案去 corporate 味 |
| `_templates/design/hanzilla-personal-site/DESIGN.md` | made-by 归属区 | product-led credibility 的 footer/about 模式 |
| `template/typing-placeholder-animation.md` | ❌ 不适用 | 无 input 场景 |
| `uhoh-inspired-service-entry` | ❌ 不适用 | 服务型 landing，非本产品形态 |

---

## 5. 优先级（impact × effort）

### P0 — 观众回路（本轮 Cursor 执行）
1. **C1 触屏 demo 控制**（双指手势 + 自适应 status 文案）
2. **B1 遥测降噪**（span/flat → `?debug=1`；angles readout 保留）
3. **E1 Typography**（Inter + IBM Plex Mono，Google Fonts preconnect+swap）
4. **A1+A2+A3 可发现性地板**（robots.txt、sitemap.xml、JSON-LD、About overlay 真实 copy）
5. **E2 归属**（About overlay 内 made-by + GitHub link）
6. **D2 share hint microcopy**
7. **G1 MediaPipe code-split**
8. **C3 WebGL 兜底**
9. **E3+E4 README + LICENSE**

### P0 — Hermes 侧（非代码）
10. **D1 OG 重做**（本地 dev + Playwright 截图 + 文案合成）
11. commit + push → CF Pages 自动部署 → 线上 marker 验证

### P1 — 下一轮（验证后再做）
12. B2 idle attract loop（+ C4 reduced-motion）
13. B4 角度标签视觉降噪
14. G3 fat-line stroke（Line2）
15. C5 键盘可达性
16. F1 analytics（待 Liz 决策：CF Web Analytics API or skip）
17. camera 真机验证（Pixel/中端 Android + iPhone Safari）

### P2 — 克制
18. D3 MediaRecorder 录屏分享（share 回路被验证后再说）
19. ZH toggle（有真实中文流量信号后再说）
20. Guess streak/分数（STEM 受众被验证后再说）

---

## 6. 明确不做（anti-scope-creep）

- 账号/backend/持久化
- 更多几何模式（continuum 就是卖点，别退回 presets）
- React 迁移（PRD 明确 prefer vanilla）
- 重型后处理/bloom
- 任何需要 dashboard 点击的部署改动

---

## 7. 反回声检查（kill/falsify）

这个产品的现实天花板：**portfolio craft piece + 可能的小型 viral toy**。不是 SaaS，没有留存模型。所以：

1. **外部证据标准：** 7 天内的有效信号 = OG 分享点击、真机 camera 成功率、一个外部人类 5 秒看懂手势。不是代码行数、不是 shader 数量。
2. **本轮优化的可证伪点：** 如果改完 OG + 首屏后，分享给 3 个外部人类仍无「卧槽怎么做到的」反应，问题不在 UI 细节，在产品形态本身 —— 停手，回到 NOTES.md 的 fork 选项（gesture protractor mini-game）。
3. **不做 F1 的代价：** 没有 analytics，上述信号只能靠手动问。接受这个手动成本，因为 CF Web Analytics 需要账号级开通动作。
4. **不要继续抛光工程。** smoothing/hold/shader 已经够好。边际收益全在观众回路。

---

## 8. 证据附件

- 首屏截图：`~/.hermes/cache/screenshots/browser_screenshot_38fa881c970141baaf700340ff541c6e.png`
- OG vision 分析结论：「elegant brand card; no product, no value prop; weak click motivation」
- 线上 headers：见 §1 表
- PRD 逐条对照：§1 表
