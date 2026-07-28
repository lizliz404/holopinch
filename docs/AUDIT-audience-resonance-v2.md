---
version: 2.0
name: HoloPinch — Audience-Resonance Audit (rebuilt)
base: DESIGN.md v1.0 (2026-07-28)
updated: 2026-07-28
status: 独立纠偏审计，非视觉规范替代品，聚焦"传播机制假设"是否成立
scope: 分发载体优先级 · 审美同质化风险 · 渠道-语言错配 · 验收标准可证伪化
note: 本审计仅基于 DESIGN.md v1.0 正文构建，未读取同名 docs/AUDIT.md 原文；如有冲突，以实际点击/完播数据为准，不以审美偏好为准
---

# 0. 核心论点（TL;DR）

DESIGN.md 把 60% 篇幅花在一张 1200×630 的静态卡片上，但这个产品的真实传播瓶颈根本不在这里——刷到它的人里，绝大多数永远不会点"开摄像头"这一步。链接预览图从来不是这类浏览器手势/WebGL demo的病毒载体，视频才是。favicon 精修得再对，也只服务于"已经决定点开"之后的 1%。

一句话结论：优先级要倒过来——Motion asset > OG 静态图 > Favicon。

---

# 1. 复核：v1.0 里判断正确、不需要动的部分

| 判断 | 结论 |
|---|---|
| 机制真实性优先于"AI感"装饰 | 对，保留 |
| 三段式受众分层（短视频/设计同侪/教师/portfolio） | 认知清楚，但清楚≠已服务（见 §2.3） |
| Color / typography token 体系 | 扎实，不需要重做 |
| "Not SaaS / Not mascot" 的反模式意识 | 判断准确，但只是防御，不产生记忆点（见 §2.5） |

---

# 2. 六个未被诊断的盲点

## 2.1 分发载体错位：你在精修"链接预览"，但真正的钩子是一段动图

摄像头授权本身就是一道高摩擦门槛。对 95%+ 的短视频/social 路人来说，"产品体验"从头到尾只会是别人转发的一段录屏，他们既不会点链接也不会开摄像头。这意味着当前 brief 里唯一缺失、却优先级最高的资产是动态素材，而不是第 10 节耗费篇幅的 OG 静态图变体 A/B/C。

Solution — 新增 Motion Asset Brief（最高优先级）：

| 项 | 规格 |
|---|---|
| 时长 | 3–6 秒，可循环 |
| 尺寸 | 9:16（短视频平台主投）+ 1:1/16:9 备用 |
| 内容 | 双手入画 → pinch 成型 → flatness 从 card 滑向 bar 的一次完整过渡 → 角度数字弹出一帧 |
| 静音约束 | 必须在"无声自动播放"环境下 3 秒内看懂，不依赖字幕音效 |
| 字幕字体 | 复用 IBM Plex Mono，保持与产品 HUD 同一视觉家族 |
| 落点 | README 顶部 + social bio + 若平台支持则补 og:video/twitter:player |

## 2.2 审美同质化：「安静奢华科技」正在变成新的默认模板

anti_reference 写了"拒绝 generic AI SaaS landing"，但实际 token 组合——近黑背景 + frosted glass 面板 + mint 强调色 + pill chip + Inter——恰好是 2025–2026 独立 SaaS/AI 产品最主流的默认审美，这套语言本身已经在同质化（设计界的"清汤寡水"：耐看，但过眼即忘）。同理，magenta→cyan→lime 的虹彩渐变，在 Web3/liquid-glass/AI 渐变审美里也早已泛滥。

Solution： 不是推翻这套系统（HUD 本就该安静），而是把唯一真正不可替换的差异化元素从一句 negative prompt（"no soft gradient blob"）提升为全篇最高优先级的护城河——硬切面（hard facet）+ 由真实手部数据驱动的 loft mesh，这是"结构性挣来的全息感"，区别于"装饰性套用的全息渐变"。

新增验收标准：去色测试——favicon/OG 去掉所有颜色只留线稿剪影，是否仍能一眼分辨"这是一个几何实体"而非任意 holographic 模板。这比"32px 时有没有虹彩感"更本质。

## 2.3 受众分层清楚，但资产分发仍是"一图服务四类人"

"lizliz.xyz 访客"要 craft credibility（stack/GitHub/作者署名），"短视频路人"要 0 秒进入"这是啥"，这两者对同一张图的期待并不冲突，但"教师/STEM"这一段被完全漏掉了——他们不会因为"看起来像全息"点进来，真正的钩子是角度实时读数这个功能，而当前 OG 三个变体里没有一个画面包含 interior angle tag。

Solution： 不是"选 A 还是 B 更好看"，而是明确分工，新增一版教育向变体：

| 变体 | 服务对象 | 核心画面 |
|---|---|---|
| OG-A（已有） | 短视频/portfolio | hands + crystal-bar，"这是什么" |
| OG-C（新增） | 教师/STEM 社群、r/webdev 类分发 | 同一 hologram + 可读的 angle tag，标题改为 "Guess the angle — with your hands" |

## 2.4 语言/渠道错配：纯英文 OG 对着一个中文语境的作者主场

domain 是 lizliz.xyz（中文可读"全息捏"），但 copy lock 强制"pick EN for OG global share"——这个判断对 Twitter/LinkedIn/Discord 是对的，但如果实际分发也覆盖小红书/B站/朋友圈，纯英文精修图会显得"隔"。更关键的是：中文社交平台的用户对"过度精修"天然有一定免疫甚至反感——他们买账的是"有点糙但真实"的那个中间地带（这正是要同时避开"清汤寡水"和"工业糖精"的原因：前者没内容，后者太假）。

Solution： 不改 OG copy lock（西方平台判断没问题），但额外声明一版 native-capture 资产：手机竖屏录屏质感、排版更随性、可带一句中文（如"徒手全息，浏览器直接玩"），专供中文平台首图，独立于 public/og.png 之外单独管理，不进代码库主分支。

## 2.5 品牌人格全部由"不是什么"定义

Brand Personality 六条里三条是"not X"（not SaaS / not mascot），能防止犯错，但不能制造记忆点——没人会因为"这不是 SaaS"而截图转发。真正带记忆点的正向意象其实已经写在文档里，只是被埋在 Emotional Promise 的感性注脚里："for five seconds you feel like you're holding light"。

Solution： 把这句（或更短变体 "hold light"）从注脚提升为贯穿 favicon/OG/About 的统一 slogan 级素材，作为社交传播真正可复述的"梗"。

---

# 3. 修订后的执行优先级

1. Motion asset（新增，最高优先级）——规格见 §2.1
2. OG-A（现有 brief 可直接执行，已经做得不错）
3. Native-capture 中文社交变体（新增）
4. Favicon（v1.0 brief 已足够扎实，仅追加 §2.2 的去色验收标准）
5. OG-C 教育向变体（可选，视增长数据决定是否投入）

---

# 4. 可证伪验收标准（比"看着顺眼"更硬的检验）

- [ ] 去色测试：favicon/OG 去掉颜色后，仍能分辨"手 + 几何实体"，而非任意 holographic 模板
- [ ] 3 秒陌生人测试：给 5 个非技术背景的人看 OG 图 3 秒，问"这是什么"，≥4/5 能说出"手/AR/全息"相关词
- [ ] 静音自动播放测试：Motion asset 在无声自动播放环境下，3 秒内清楚传达"手势 → 全息"
- [ ] 渠道分离测试：中文平台首图与英文 OG 分开统计点击/完播率，而非假设一图两边通用

---

# 5. 一句话总结给执行者

favicon 和 OG 的活儿，v1.0 已经把它做对了；这份 v2 真正要纠的偏是排序——先把那 3–6 秒的手势成型视频做出来，因为对绝大多数会刷到 HoloPinch 的人来说，那段视频就是产品本身。
