# HoloPinch — 产品、工程与分发审计 v3

> 日期：2026-07-28  
> 范围：当前 `main`（源码、构建产物、线上页面/headers、静态社交资产、依赖）  
> 方法：逐文件审阅 + `npm run build` + `npm audit` + live browser/visual inspection + Cursor 独立 PASS 1 复核。  
> 前版归档：[`docs/archive/AUDIT-2026-07-28-pre-v3.md`](archive/AUDIT-2026-07-28-pre-v3.md)。它记录的多项 P0 已在后续提交修复，不能再作为现状。

## 执行摘要

HoloPinch 的问题不再是“能否做出手势驱动的全息体”——这件事已经成立。真正卡住共鸣的是因果链 **“手势 → 实体 → 我在握住光”** 有没有被首访和分发讲清楚：

1. **首访曾自动要 camera，把魔法推到权限之后。** 旧路径实测可停在 `Requesting camera…`；`getUserMedia()` 允许 Promise 永不 settle。**本轮已改为显式 Start camera + demo attract。**
2. **分发素材仍不服务产品幻想。** 线上 `og:image` 仍是 logo-only `og.png`；现有 9:16 still / orb motion 不是人手。这是下一刀，不是 CSS 问题。
3. **角度曾默认抢第一眼。** STEM 有潜力，但不该当首屏遥测。**本轮默认 Angles off。**
4. **实时管线 churn。** 同 frame 检测结果缓存已有；本轮加了 same-input geometry reuse + 拓扑 hysteresis。完整 buffer pool 仍是真机 jank 时的下一刀。
5. **工程底盘已比旧审计写得好得多。** touch demo、telemetry gate、字体、SEO、About、code-split、WebGL fallback、headers 都在；`npm audit --omit=dev` 0；build 通过。

**核心判断：** 不要把它扩成 AR 工具箱，也不要继续精修黑底 logo。下一轮只验证一个命题：**无标签的“持光”是否能在 3 秒内让陌生人看懂并想试。** 失败才把 angle 升格为真正的 gesture-protractor game。

**总体：7.4 / 10（本轮代码落地后）。** 交互原型与基础工程 8+；真机性能与真实人手分发素材仍是上限。

---

## 0. 本轮已落地（v3 → code）

| 项 | 状态 | 位置 |
|---|---|---|
| 显式 `Start camera`，取消自动 `getUserMedia` | done | `src/main.ts` |
| 首屏无标签 continuum attract（`prefers-reduced-motion` 关闭） | done | `src/main.ts` |
| 默认 Angles off；About 文案同步 | done | `main.ts` / `index.html` |
| 同 camera frame 复用 geometry（identity cache） | done | `src/scene.ts` |
| flatness 拓扑 Schmitt hysteresis | done | `src/flatness.ts` + `scene.ts` |
| 双手按图像 x 排序 | done | `src/anchors.ts` |
| GPU → CPU HandLandmarker fallback | done | `src/hands.ts` |
| angle label DOM pool（不再每帧 innerHTML） | done | `src/main.ts` |
| `h1` + About close / `aria-modal` / focus return | done | `index.html` / `main.ts` / `style.css` |
| `:focus-visible` | done | `src/style.css` |
| 后台 tab 暂停 camera track | done | `src/main.ts` |
| 相机错误映射（denied / missing / busy） | done | `src/main.ts` |
| 去词标虹彩循环（清汤/糖精风险） | done | `src/style.css` |

**仍未做（需素材/真机）：** 真人手势 OG/9:16 master；iOS/中端 Android QA；MediaPipe 1.0；完整 geometry buffer reuse（beyond same-frame）；纯函数测试/CI；CSP。

---

## 1. 当前事实与历史纠偏

| 历史报告中的说法 | 当前 HEAD | 证据 |
|---|---|---|
| 无 touch demo control | 已修 | `src/demo.ts:110-131`：双指竖向 `open`、横向 `spread` |
| `span` / `flatness` 首屏遥测 | 已修 | `src/main.ts:33-34,467-478`：仅 `?debug=1` |
| Segoe / 无品牌字体 | 已修 | `index.html:16-21`、`src/style.css:20,339-346` |
| 无 robots/sitemap/JSON-LD/About | 已修 | `public/robots.txt`、`public/sitemap.xml`、`index.html:42-65,78-111` |
| MediaPipe 在首包 | 已修 | `src/main.ts:195-202` 动态 import；build 输出独立 `hands-*.js` 40.55 KB gzip |
| WebGL 失败白屏 | 已修 | `src/main.ts:56-78` |
| OG 缺产品画面 | **仍成立** | `index.html:30,40` 指向 logo-only `public/og.png` |
| 首屏有仪表盘味 | **本轮已降** | 默认 `showAngles = false`；角度改 opt-in |

---

## 2. 发现与可执行解法

| 优先级 | 发现 | 证据 | 为什么重要 | 最小有效方案 | 验证 / kill criterion |
|---|---|---|---|---|---|
| **P0** | 自动 permission 抢在价值展示之前；等待可无限长 | `main.ts:500-503`；live 状态 `Requesting camera…`; [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) 明确允许 Promise 不 resolve/reject | 用户第一段体验成了“系统向我索权”，不是“我能捏住光” | 默认 demo attract；只在明确 `Start camera` 点击时调用 `getUserMedia`；拒绝态保持 Demo 可玩 | 5 个冷启动用户：10 秒内能说出下一步；无 camera 也能拖出形体 |
| **P0** | 首屏默认显示 `°`，把 magic 降级成 telemetry | `main.ts:97,467-480`; `index.html:149` 初始 active | 角度应是第二个受众的入口，不该污染所有人的第一秒 | 默认 `Angles` off；首次主动交互后才允许打开；capture 也隐藏角度 | 3 秒陌生人测试：描述先出现“手/光/实体”而非“角度/测量” |
| **P0** | OG 与 motion 主资产不传达产品 | live `og.png` 视觉检查；`public/media/*` 视觉检查；`index.html:30,40` | link preview 是点击前唯一的产品界面；logo 卡只卖审美，不卖幻想 | **不要**把当前 orb still 冒充人手素材；录一段真实 camera path（手腕至手指、无角度 HUD），再替换 `og.png` | 5 人看缩略图 3 秒，≥4 人说出手/手势/全息实体；否则重录而非改字 |
| **P0** | 同一 camera frame 可被重复 rebuild geometry | `hands.ts:87-92` 缓存结果；`main.ts:456-481` 仍更新；`scene.ts:150-161,285-304` 每次 dispose/recreate | `EdgesGeometry` + new `Mesh` + typed arrays 的 rAF churn 会吃掉 mobile 预算 | 对相同 landmark array identity 复用 geometry，只重新投影标签/更新 opacity；后续真机 profile 决定是否转 `requestVideoFrameCallback` | Chrome Performance + 中端 Android：比较 GC/long task、camera FPS；不能只看 desktop |
| **P1** | About 是自制 modal，没处理 focus / inert / close affordance | `index.html:77-111`、`main.ts:156-161,339-360`；live HTML 无 `<h1>`；[W3C H102](https://www.w3.org/WAI/WCAG21/Techniques/html/H102) | keyboard / screen reader 可以落到被遮罩的后台；对话框也没有可见 close button | brand 改语义 `h1`；About 迁到原生 `<dialog>` 或实现 focus return/trap + close button | Tab / Shift+Tab / Esc：焦点不越界，关闭回 `?` |
| **P1** | Core maths / anchor / geometry 无回归测试或 CI | `package.json` 仅 dev/build；仓库无 test/CI config | `flatness` 阈值、ring winding、one-hand padding 都是纯函数，最适合低成本锁死 | 下一小步加 Node/Vitest 的纯函数 tests；不要给 DOM/WebGL 做脆弱 snapshot | 包含 degenerate ring、NaN landmark、threshold 边界、winding flip |
| **P1** | camera 错误把原始 browser message 直接露给人 | `main.ts:255-264` | 无害但不像产品；不同 UA 的文案会很丑 | 按 `NotAllowedError` / `NotFoundError` / `NotReadableError` 映射为明确恢复动作，开发细节留 console | 阻止权限 / 无 camera / 被占用三种状态都给出可操作下一步 |
| **P2** | `prefers-reduced-motion` 只停 text animation，demo / capture mesh 仍在动 | `style.css:678-694`；`demo.ts:210-220` | 一旦加 intro attract，尊重 motion preference 必须端到端 | reduced-motion 时停 attract，仅展示静态 demo + CTA | OS reduced-motion 下不自动移动，但 interaction 仍正常 |
| **P2** | CDN-hosted WASM/model 是运行时单点依赖；依赖 major 可升级但未验证 | `hands.ts:19-23`；`npm outdated`：tasks-vision 0.10.35 → 1.0.0 | 不是立刻升级的理由；是 offline / regional / release-risk 边界 | 先做真机兼容矩阵；若可靠性是目标，再把 wasm/model 固定并静态托管 | 断网 / CDN 故障模拟、iOS/Android cold start；失败前别迁 SDK |
| **P2（假设）** | `flatness` 的 0.65 / 0.75 离散切换可能在临界姿势闪烁 | `flatness.ts:94-99`，已有 smoothing `scene.ts:47-50,169-177` | 只会在真实手抖+阈值附近发生，源码不能证明严重度 | 真机录像；若闪烁，加入 hysteresis 而非再调一堆 magic numbers | 手在阈值附近停 5 秒，card/wire 不应来回跳 |

---

## 3. 可直接做 vs 必须先取证

### 可以直接做（本轮）

1. 显式 `Start camera`、不再自动请求 permission。
2. 默认关闭 Angles，冷启动复用现有 continuum 做无标签 attract，`prefers-reduced-motion` 关闭它。
3. 缓存同一 decoded frame 的 geometry，消除无效 rebuild。
4. 给 document 真实 `h1`；更新当前产品行为文档。
5. 本地 build + source-level browser smoke + deploy 后 Origin-header asset check。

### 需要外部证据，不假装“优化完成”

1. **真人手势 OG / 9:16 master**：不是代码问题。当前 orb 素材不能替代；需要真实 camera 录屏。
2. **iOS Safari / 中端 Android camera QA**：这是 PRD kill criterion，Hermes 环境无真机证明。
3. **MediaPipe 1.0 升级**：有 major update 不等于应该升级；需要 API + device regression。
4. **Angle 是不是独立 wedge**：需要教师 / kids / 3D 同行的定向 7-day test，不是继续堆 Guess chip。

---

## 4. 产品方向：有趣 + 有用，而不是两个半成品

### 现在的结构性优势

- 不是“滤镜”：真实 hand landmarks 驱动 dynamic loft，且 `flatness` 同时影响形态、透明度、内线和材质。
- 不是清汤 UI 的唯一性：hard facets 在去色后仍该是实体；黑底、mint、glass 只是安静的背景。
- 有一条可用但尚未产品化的教育支线：`angle → guess → reveal`。

### 最强、最小的市场实验

**默认让每个人先“hold light”；Angle 只在主动打开后成为 STEM layer。**

- 版本 A：无标签 intro / 真人手势视频 / 明确 Start camera。
- 版本 B：同一基础，仅对教师或 r/webdev 分发展示 angle variant。
- 7 天只收三类信号：3 秒理解率、camera 成功后留在页面的定性反馈、哪一个素材让人主动转发。
- 若 A 仍被说成“又一个虹彩 shader”，别继续抛光。直接 pivot 为 **gesture protractor mini-game**：角度成为任务和反馈，而不是浮在画面上的数字。

### 明确不做

- 账号、backend、排行榜、广告、newsletter。
- 几何 preset 大全、贴纸库、AR filter marketplace。
- 多段 marketing landing、feature grid、React 重写、重型 post-processing。
- 用更漂亮的 logo 代替真人手势素材。

这些都增加系统体积，不增加“我想试一下”的冲动，也不增加角度玩法的真实教育价值。

---

## 5. 验证记录与边界

### 已验证

- `npm run build`：通过；Vite 8 产物为 main 141.27 KB gzip + lazy `hands` 40.55 KB gzip；有 >500 KB minified chunk 警告。
- `npm audit --omit=dev --audit-level=high`：0 vulnerabilities。
- 线上 `/`、`robots.txt`、`sitemap.xml`、`og.png`、favicon、motion assets：HTTP 200。
- 线上 Origin-header hashed JS：`content-type: application/javascript`、immutable；未复发历史 cache poison。
- `_headers`：`nosniff`、`DENY`、camera `(self)`、referrer policy 均存在。
- **本轮改前**线上：无 `h1`；可长期卡在 `Requesting camera…`；CTA 为 `Retry camera`。
- **本轮改后（待 deploy 验证）：** 本地 `tsc`/`build`；首访应为 `Start camera` + demo attract、Angles 默认关。

### 未验证 / 不作假设

- 真机 camera tracking quality、battery/thermal、iOS Safari 行为。
- 实际 social preview cache refresh、点击/完播/分享指标。
- 外部用户是否真的把 “hold light” 当作可复述记忆。

## 6. 参考的外部最佳实践

- [MDN — `getUserMedia()`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)：HTTPS、明确 permission、请求可能无限 pending。
- [MDN — `requestVideoFrameCallback()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback)：video processing 应按新 video frame 而非盲目 display rAF；作为后续真机 profile 后的升级路径。
- [W3C — native modal dialog](https://www.w3.org/WAI/WCAG21/Techniques/html/H102)：原生 `<dialog>` 负责 focus、inert background、Esc 与 focus return。

---

**当前决策：** 先 ship 首访与 same-frame geometry 修正；然后拿真实人手视频做 3 秒测试。  
**信心：** 高（源码/构建/live/资产）；中（用户与真机反应）。  
**Owner：** Liz 决定真实素材与 distribution；Hermes 负责代码、审计闭环与 deployment verification。  
**下个 checkpoint：** push 后线上 smoke；随后 5–10 个非技术观察者 + 至少 Android/iOS 各一台真机。
