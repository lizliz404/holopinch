---
version: 1.1
name: HoloPinch
updated: 2026-07-28
status: brand + visual design brief — distribution priority corrected by AUDIT-audience-resonance-v2
audience_primary: short-video / AR-curious scrollers; design & 3D curious; STEM / teachers; lizliz.xyz portfolio visitors
anti_reference: generic AI SaaS landing · pure logo-on-black OG · neon cyberpunk clutter · robot/mascot AI kitsch · instrument-panel-first UI · soft holographic gradient blobs without hard facets
repo: lizliz404/holopinch
live: https://holopinch.lizliz.xyz/
local: /home/ubuntu/projects/holopinch
related_audits:
  - docs/AUDIT.md
  - docs/AUDIT-audience-resonance-v2.md
  - docs/INCIDENT-asset-cache.md
---

> **DESIGN.md quality audit** · 2026-08-02 · gold: beautiful-html-templates/soft-editorial
> - **Genre:** B brand/distribution brief（含 motion-first 分发优先级）
> - **Grade A (UI system):** n/a in this file — implementation visual system lives in [`docs/DESIGN.system.md`](./DESIGN.system.md) (**A ≈ 8.5/10**)
> - **Grade B (brand brief):** 9/10 — 身份、记忆点 hold light、P0 motion>OG>favicon、token 抽取、favicon/OG prompt 与验收齐全
> - **Strengths:**
>   - §0 分发优先级与 falsifiable acceptance 可执行
>   - 正向人格（hold light）+ 结构性全息 moat，非纯 not-SaaS
>   - Design tokens 标注 extracted from live code（表格级；机器 YAML 见 system 文档）
>   - Favicon/OG/Motion brief + ready prompts
> - **Gaps vs gold pattern:** 本文不承担 Genre A；UI 实现勿只读本文 token 表
> - **Verdict:** keep-as-is（品牌/分发 SSOT）· **split done** → `DESIGN.system.md`
> - **Next action:** 改 CSS token 时同步 `DESIGN.system.md`；改分发策略时改本文

# HoloPinch — Design Brief

> Single source of truth for brand/visual identity + **distribution asset priority**.
> Downstream image AI uses §§9–10 for favicon/OG. Motion is higher priority than both
> (see §0 and `docs/AUDIT-audience-resonance-v2.md`). Not a product roadmap (`PRD.md`).
>
> **UI implementation / coding-agent visual system:** [`docs/DESIGN.system.md`](./DESIGN.system.md)
> (YAML tokens, Signature Treatments, CJK, Iteration Guide). When CSS and this brief disagree
> on measurements, prefer `src/style.css` + `DESIGN.system.md`.

---

> **前置诊断（v1.0）：** 工程扎实，观众回路曾断开。P0 已上线。favicon/OG **可抓取**，但是「黑底双菱 + 字标」——点击动机弱。
>
> **纠偏（v2.0 audience audit）：** v1 把力气花在静态 OG 上，但这类浏览器手势 demo 的真实载体是 **3–6s 动图/录屏**。绝大多数路人不会点链接、更不会开摄像头。优先级必须倒过来：**Motion asset > OG 静态图 > Favicon**。HUD 的「安静奢华科技」可保留，但差异化护城河是 **硬切面 + 手部数据驱动的 loft mesh**（结构性全息），不是虹彩滤镜。正向记忆点：**hold light**（不要只靠 not-SaaS 防御定义人格）。

---

## 0. Distribution priority (v2 lock)

| Priority | Asset | Job |
|---|---|---|
| **P0** | **Motion** 3–6s loop (9:16 + 1:1/16:9) | For 95%+ of viewers **this is the product**. Silent autoplay must read “hands → hologram” in 3s |
| P1 | OG-A 1200×630 | Link preview for people who already might click; hands + crystal-bar + value prop |
| P1b | Native-capture 中文社交竖屏 | 小红书/B站/朋友圈 — 可糙、可中文，**不进** `public/og.png` 主路径 |
| P2 | Favicon | After-click chrome / bookmark; 16px silhouette of faceted diamond |
| P3 | OG-C STEM | Optional: angle tags + “Guess the angle — with your hands” |

**In-repo capture path:** `/?motion=1` auto-plays card↔bar continuum with chrome hidden (`capture-clean`). Record that URL for motion masters.

**Falsifiable acceptance (from v2 audit):**

- [ ] Desaturation test: favicon/OG without color still read as geometric solid (not generic holo blob)
- [ ] 3s stranger test on OG: ≥4/5 non-tech say hand/AR/hologram
- [ ] Silent autoplay test on motion: gesture → holo clear in 3s
- [ ] Channel split: CN native vs EN OG measured separately

---

## 1. Product Identity

**HoloPinch** — pinch the air; hold a living holographic solid between your hands.

| Field | Value |
|---|---|
| Public name | HoloPinch |
| Domain | https://holopinch.lizliz.xyz/ |
| One-liner | Pinch the air. Hold a living holographic solid between your hands. |
| **Slogan (shareable)** | **hold light** / Hold light between your hands |
| Title (meta) | HoloPinch — Hold a hologram between your hands |
| Description (meta) | Browser AR toy: pinch with both hands and a living holographic mesh appears between them. MediaPipe + WebGL. No app install. |
| Tagline (in-product) | Hold light between your hands. No app. Just a browser. |
| Category | Browser AR toy / craft demo / portfolio product (not SaaS) |
| Stack (for craft credibility only) | Vite · TypeScript · three.js · MediaPipe HandLandmarker |
| Price | Free · no account · no backend |
| Author | Liz · https://lizliz.xyz · source https://github.com/lizliz404/holopinch |

### What it does (mechanism, not magic hand-wave)

1. **Input:** two hands (camera MediaPipe, or demo orbs)
2. **Geometry:** continuous dynamic loft mesh between two hand sections
3. **Look:** hybrid shader = normal→RGB facets × thin-film holographic wash + white edges
4. **Continuum:** one scalar `flatness ∈ [0,1]` — opaque foil **card** ↔ translucent faceted **crystal bar**
5. **Play:** interior angle labels + optional guess mode

### Name rationale

- **Holo** = the screenshot people want
- **Pinch** = the exact gesture (thumb + index corners)
- Short, speakable, product-true; EN/中文语境可读作「全息捏」

### Who it's for

| Segment | Why they care | Hook |
|---|---|---|
| Short-video / AR curious | TikTok-Effect-House magic in a browser tab | “Hold a hologram with your fingers” |
| Design / 3D / frontend peers | Mesh from body, zero art assets | Normal→RGB + foil craft |
| Teachers / STEM kids | Real-time angle readout on a gesture | Guess-the-angle |
| lizliz.xyz visitors | Interactive craft proof | Subdomain product, not a gist |

---

## 2. Brand Personality

| Trait | Meaning |
|---|---|
| **Hold light** | Primary positive image — five seconds of holding light between your hands |
| Magical-but-true | Looks like magic; mechanism is honest if you look |
| Playful, sharp | Zero corporate; short copy; no therapy-speak |
| Craft-forward | **Hard facets** + loft from real hand data — not soft blobs or stock AR stickers |
| Dark-stage calm | Near-black stage, quiet HUD; hologram is the star |
| Not a SaaS / not a mascot | Defensive only — never lead brand story with “what we aren’t” |

**Voice:** sharp, playful, zero corporate.  
**Shareable hook:** `hold light` / `#HoloPinch` / “Screenshot it — tag #HoloPinch”

Examples locked in product:

- “Hold light between your hands. No app. Just a browser.”
- “Screenshot it — tag #HoloPinch”
- “Camera on — show both hands and pinch”

**Emotional promise (promoted from footnote):** For five seconds you feel like you’re holding light — then you can share it.

**Differentiation moat (not a filter):** hard facet geometry + hand-driven loft mesh = structural holography. Desaturation test must still read “solid,” not “gradient template.”

---

## 3. Visual Style

### Overall look

**Dark stage + living iridescent solid.** Full-viewport WebGL stage. Minimal frosted HUD. The product *is* the mesh, not a marketing page wrapped around a video.

Reference continuum (from product refs, not stock):

| Pole | Feel |
|---|---|
| High flatness (card) | Wide thin parallelogram / foil card; more opaque; magenta-core thin-film; perimeter white stroke only |
| Low flatness (crystal bar) | Elongated shallow prism; translucent; multi-hue facets (lime/cyan center bias OK); internal white wires |

### Color behavior

- Stage stays near-black; never pure #000 void if a slight cool navy helps depth
- Hologram carries **all** the chroma — magenta → purple → cyan → lime/yellow spectral travel
- UI chrome is desaturated; one mint accent for “live / active”
- White edges on mesh = signature “hologlass” read

### Typography (from `_templates/design-typography-font-preferences.md` — already in product)

| Role | Stack | Weights |
|---|---|---|
| UI / brand | `"Inter", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif` | 400 / 600 / 800 |
| Telemetry / angles / code | `"IBM Plex Mono", "JetBrains Mono", "SF Mono", ui-monospace, monospace` | 400 / 500 |
| Load | Google Fonts + `preconnect` + `display=swap` | — |

**Never** bare `sans-serif` / `Segoe UI`-led system defaults.

### Spacing & chrome

- HUD: max ~440px wide, 16px radius, frosted dark panel, 1px hairline border
- Chips: pill radius 999px
- Safe-area aware top/bottom insets
- Mobile: hide tagline; enlarge demo handles

### Motion

- Mesh follows hands every frame
- Demo has subtle breath (~0.4% float) so stage never feels frozen
- Prefer reduced-motion respect for any future attract loop (P1)
- No bounce-easing SaaS buttons; chrome is quiet

### Component keywords

Dark stage · frosted glass HUD · pill chips · mint active state · white wire edges · faceted iridescence · dual pinch orbs (demo) · interior angle tags · sticky about attribution

---

## 4. Design Tokens (extracted from live code — do not invent)

Source: `src/style.css`, `index.html`, `public/favicon.svg`, shaders.

### Colors

| Token | Hex / value | Role |
|---|---|---|
| `--bg` | `#0a0a0c` | Page / stage base |
| Stage radial | `#1a1a24` → `#070709` | Soft vignette center |
| `--panel` | `rgba(12, 12, 16, 0.72)` | HUD / about glass |
| `--line` | `rgba(255, 255, 255, 0.14)` | Borders |
| `--text` | `#e8e6e3` | Primary text / mark stroke fill |
| `--muted` | `#9a958c` | Secondary / status |
| `--accent` | `#7dd3c0` | Live mint — active chips, angles readout, primary CTA edge |
| Primary CTA text | `#d8fff5` | On mint-tinted button |
| `--warn` | `#f0b429` | Guess result / right demo handle |
| theme-color | `#0a0a0c` | Browser chrome |
| Mesh edges | `#ffffff` @ ~0.95 opacity | Hologlass stroke |
| Left demo orb | mint fill `rgba(125,211,192,0.28)` + white ring | |
| Right demo orb | amber fill `rgba(240,180,41,0.28)` + `#f0b429` ring | |

### Hologram palette (shader intent — not flat brand swatches)

- **Card / foil pole:** magenta–magenta-pink core (~hue 0.82–0.92), cyan–yellow rim wash, high film mix
- **Bar / crystal pole:** multi-facet spectral; center face bias **lime / cyan-green** (~hue 0.38); lower opacity 0.55–0.7 so background bleeds
- Normal→RGB base always present under film; facets read as hard shaded planes, not soft gradients

### Type sizes (UI)

| Element | Size |
|---|---|
| Brand wordmark | `clamp(1.35rem, 4.2vw, 1.7rem)` weight 700, tracking `-0.03em` |
| Tagline | 12px muted |
| HUD body | 13px |
| Primary CTA | 15px / 600 |
| Chips | 12px pills |
| Angle tags | 12px mono pills on `rgba(0,0,0,0.55)` |

### Radius / blur

| Token | Value |
|---|---|
| HUD / about | 16px |
| Buttons | 10px |
| Chips / angle tags | 999px |
| Backdrop blur | 14–16px |

### Existing mark (shipping now — to be replaced)

`public/favicon.svg` — concentric diamonds on transparent:

- Outer rhombus stroke `#e8e6e3`, stroke-width 2.2, no fill
- Inner solid rhombus `#e8e6e3` @ 0.92 opacity
- ViewBox 0 0 32 32

`public/og.png` — 1200×630, near-black, same double-diamond + white “HoloPinch” wordmark, **no product, no hands, no value prop** (low click motivation).

---

## 5. Component Language (product UI)

This is an **app shell**, not a multi-section landing.

```
┌─────────────────────────────────────────────┐
│  HoloPinch                    [?]           │  brand + about
│  tagline (desktop)                          │
│                                             │
│           [ dark stage + mesh ]             │
│        (demo orbs only in demo)             │
│                                             │
│  status · angles readout                    │
│  [ Start camera ]                           │
│  Demo · Angles · Edges · Guess · Shade      │
└─────────────────────────────────────────────┘
```

| Piece | Behavior |
|---|---|
| Brand | Top-left, pointer-events none |
| `?` | Top-right; opens About dialog with real indexable copy + lizliz.xyz + GitHub |
| Primary CTA | Full-width mint-outline “Start camera” / “Stop camera” |
| Chips | Toggle modes; active = mint border + tint |
| Demo orbs | 36–42px circles; left mint / right amber |
| Angle tags | Mono pills projected at interior bisectors |
| WebGL fallback | Centered glass card explaining browser need |

**UI is not:** pricing tables, hero carousels, feature grids, newsletter captures, top promo bars.

---

## 6. Current Structure & Metadata

| Item | Status |
|---|---|
| Live deploy | Cloudflare Pages, GitHub-connected `lizliz404/holopinch` @ `main` |
| robots.txt / sitemap.xml | Present |
| JSON-LD | `WebApplication` |
| OG/Twitter tags | Present → `og.png` 1200×630 |
| Favicon | `favicon.svg` |
| About copy | In `index.html` (indexable) |
| Analytics | None (deliberate pending decision) |

Key headlines already locked (do not invent alternate product names):

- **HoloPinch**
- Hold a hologram between your hands
- No app. No filter pack. Just your hands and a browser.

---

## 7. Audience & Tone

### Do

- Lead with the **gesture + object** (“pinch”, “hold”, “between your hands”)
- Show **both hands + mesh** whenever the format allows
- Prefer crystal-bar silhouette for “wow” stills (more 3D, more facets, more color travel)
- Keep copy under one breath; pain-first secondary line is optional

### Don’t

- Sound like SaaS (“unlock synergy”, “all-in-one platform”)
- Lead with stack names in marketing surfaces (MediaPipe/WebGL OK in About/Tech only)
- Show naked telemetry (`span` / `flat`) outside `?debug=1`
- Use robot hands, VR headset clichés, or purple-blue “AI gradient” blobs with no geometry
- Put the wordmark over a busy photo without a dark stage plate

### Cultural notes

- EN default UI (PRD)
- Portfolio audience needs **Made by Liz · lizliz.xyz** (already in About) — OG may omit personal brand if product magic is clearer alone; optional small “lizliz.xyz” corner is OK if it doesn’t steal focus

---

## 8. Reference Aesthetics

### Steal from (feel, not clone)

- Effect-House / TikTok hand-AR demos: **gesture readability**
- Graphics debug beauty: **normal visualization as final look**
- Stripe/Linear restraint for **HUD only** (quiet chrome)
- Thin-film / soap-bubble / oil-slick iridescence on hard facets

### Product refs in repo

- `public/refs/ref-card-quad.jpg` — four-corner pinch foil card
- `public/refs/ref-crystal-bar.jpg` — end-grip shallow crystal bar  
  (also under `src/assets/refs/` + `RECON.md` if present)

### Anti-references

- Generic startup OG: logo + wordmark centered on black/gradient
- Cyberpunk city / matrix rain
- Soft 3D claymorphism hands
- App-store screenshot chrome with phone bezels (unless a future campaign needs it)
- Rainbow stroke logos with no interior form

---

## 8.5 Motion Asset Brief (P0 — highest distribution leverage)

| Spec | Value |
|---|---|
| Duration | 3–6s, seamless loop preferred |
| Aspect | **9:16 primary** (short video); also 1:1 and 16:9 |
| Silent | Must read with **no audio** in 3s |
| Story beat | hands/orbs present → pinch solid forms → **flatness card→bar** once → angle digits tick once |
| Type on frame | Optional end card: **hold light** / HoloPinch — IBM Plex Mono or Inter, sparse |
| CN native | Separate vertical capture, line e.g.「徒手全息，浏览器直接玩」— store outside main `og.png` path |
| Capture URL | `https://holopinch.lizliz.xyz/?motion=1` (chrome stripped) |
| Ship paths | `public/media/holopinch-loop-9x16.webm` (+ mp4 fallback), README embed, social bio |

**Do not** substitute a prettier static OG for this asset.

---

## 9. Favicon Design Brief

### Formats to deliver

| File | Size | Notes |
|---|---|---|
| `favicon.svg` | scalable | Primary; replace `public/favicon.svg` |
| `favicon-32.png` | 32×32 | Optional fallback |
| `apple-touch-icon.png` | 180×180 | Optional |
| `icon-192.png` / `icon-512.png` | PWA-ready optional | Not required for current static toy |

### Job of the mark

At **16×16**, still read as: **pinch / diamond solid / holo** — not a generic gem app icon.

### Geometry direction (preferred)

Evolve the shipping concentric-diamond, don’t throw craft away:

1. **Outer thin rhombus** stroke in off-white `#e8e6e3` (keep family continuity)
2. **Inner solid** not flat white — a **tiny faceted plane** with 2–3 hard shade breaks in hologram hues (magenta → cyan or lime tip)
3. Optional: one **mint `#7dd3c0` micro-accent** (single vertex or inner edge) so it ties to UI accent — never full neon glow plate
4. Transparent background for SVG; for PNG app icons, use `#0a0a0c` rounded square plate only if store requires opacity

### Mood

Quiet dark-stage craft. Magical geometry. No letters inside the favicon (wordmark fails at 16px).

### Avoid

- Full “HP” monogram
- Soft Gaussian glow dominating the silhouette
- Photo hands at favicon scale
- Busy prism with 20 facets that muddies to gray at 16px
- Colored circle badge that looks like every other AR kit

### Acceptance criteria

- [ ] Recognizable as related to current diamond mark when placed side-by-side
- [ ] At 16px: clear outer diamond silhouette, not a blob
- [ ] At 32px: some iridescent / facet read
- [ ] **Desaturation test:** grayscale still reads as faceted geometric solid
- [ ] Works on both light and dark browser chrome (stroke weight tested)
- [ ] No text

### Image-generation prompt (favicon)

```text
Design a minimal app favicon mark for “HoloPinch”, a browser AR toy where two hands pinch a living holographic mesh.

Format: square icon, master at 1024×1024, also must read at 16×16 and 32×32. Deliver concept as flat vector-friendly shapes (hard edges), not photoreal. Transparent background.

Composition: concentric diamond / rhombus mark, centered. Outer diamond = thin clean stroke in off-white (#e8e6e3). Inner diamond = small faceted holographic plane with 2–3 flat shaded facets (not a soft gradient blob). Facet colors: magenta-pink core shifting to cyan and a touch of lime on one tip — thin-film iridescent, hard facet breaks like low-poly glass. Optional single micro accent edge in mint teal (#7dd3c0). No glow bloom larger than 5% of icon. No letters, no wordmark, no hands, no camera glyphs, no robot.

Style: dark-stage craft, quiet luxury tech, graphics-demo beauty, not cyberpunk clutter, not generic AI-purple blob, not gemstone jewelry logo. Crisp SVG-ready silhouettes, optical balance for small sizes, generous padding (~12% margin).

Lighting: simple flat facet shading only; white hairline edge on outer rhombus.
```

**Negative prompt (if tool supports):**

```text
text, letters, monogram, hands, fingers, photo, 3d render blur, heavy bloom, neon city, robot, mascot, cartoon, gradient circle badge, app store clutter, busy details, soft clay, metallic gold, crystal gemstone photography
```

---

## 10. OG Image Design Brief

### Format

| Spec | Value |
|---|---|
| Size | **1200 × 630** px (exact) |
| Safe zone | Keep critical content inside ~1080×540 center; avoid edge crop on some platforms |
| File | `public/og.png` (replace), PNG or high-quality JPG under ~300KB if possible |
| Platforms | iMessage / Twitter-X / Telegram / LinkedIn / Discord link previews |

### Job of the OG

**Stop the scroll.** Communicate in &lt;1s: *human hands pinch → living hologram between them → works in browser.*

Current asset fails this (logo-only). New asset must include **product fantasy**, not just brand geometry.

| Variant | Audience | Core frame | Copy |
|---|---|---|---|
| **OG-A** (default `og.png`) | short-video / portfolio | hands + crystal-bar | Hold a hologram between your hands |
| OG-B | alternate | foil card quad pinch | same |
| **OG-C** (optional) | STEM / teachers / r/webdev | same holo **+ readable angle tags** | Guess the angle — with your hands |
| **CN native** | 小红书/B站/朋友圈 | phone-vertical, slightly raw screen feel | 徒手全息，浏览器直接玩 — **not** `public/og.png` |

### Preferred layout (lock) — OG-A

```
┌──────────────── 1200 × 630 ────────────────┐
│  dark stage #0a0a0c + soft cool vignette   │
│                                            │
│     [left hand pinch]  HOLO MESH  [right]  │
│         crystal-bar / shallow prism pose     │
│         white edges + iridescent facets      │
│                                            │
│  HoloPinch                                 │
│  Hold a hologram between your hands        │
│  (optional small) no app · just a browser  │
└────────────────────────────────────────────┘
```

**Variant A (recommended):** illustrated/cinematic still of two hands (crop: wrists to fingers, no face) pinching ends of a **translucent crystal bar** hologram — matches `ref-crystal-bar` energy.  
**Variant B:** flatter foil **card** between four pinch corners — matches `ref-card-quad`; use if A gets too busy.  
**Variant C (type-forward):** real product screenshot plate (mesh + dark UI) + large type; only if screenshot is already beautiful.

### Copy lock (use exactly; EN)

| Role | Text |
|---|---|
| Wordmark | HoloPinch |
| Headline | Hold a hologram between your hands |
| Optional sub | No app. No filter pack. Just a browser. |
| Optional URL | holopinch.lizliz.xyz |

Typography on OG: **Inter** bold/extrabold for wordmark + headline; tracking slightly tight on wordmark. Sub in regular Inter or muted mono only if needed. Off-white `#e8e6e3` text; sub `#9a958c`. Soft text shadow OK for legibility on mesh.

### Color lock

- Background: `#0a0a0c` stage, optional radial `#1a1a24`
- Mesh: magenta/purple/cyan/lime iridescence + **white** edge strokes
- Accent sparingly: mint `#7dd3c0` on a tiny UI chip or underline — not a teal wash over the whole card
- Hands: natural skin, understated; not plastic CGI mannequin; dimly lit so mesh stays hero

### Avoid

- Logo-only centered card (current failure mode)
- Huge phone bezel mockups
- Unreadable tiny HUD screenshots as the only content
- Stock “VR goggles future city”
- Watermarks, QR codes, multiple CTAs
- Chinese + English competing headlines (pick EN for OG global share)

### Acceptance criteria

- [ ] 1200×630 exact
- [ ] At thumbnail size (~300px wide) still reads “hands + glowing solid”
- [ ] Wordmark legible
- [ ] Headline legible
- [ ] Feels same family as dark HUD + mint accent product UI
- [ ] Stronger click motivation than current double-diamond logo card

### Image-generation prompt (OG — primary)

```text
Create an Open Graph social share image, exactly 1200×630 pixels, for “HoloPinch”.

Scene: near-black dark stage background (#0a0a0c) with a soft cool vignette (#1a1a24 center). Centered: two real human hands entering from left and right edges (wrists to fingers only, no face, no torso distraction), each doing a precise thumb+index pinch grip. Between the hands floats a living holographic shallow crystal bar / low-poly prism — translucent, faceted, iridescent thin-film colors traveling magenta → purple → cyan → lime-green, hard facet shading (not soft airbrush), crisp thin white edge lines on outer silhouette and some internal facets, like hologlass. The mesh should feel gripped at both ends, slightly elongated horizontal, magical but geometric.

Typography lower-left or lower-third, clean modern Inter-like sans:
- “HoloPinch” large, bold, off-white #e8e6e3, tight tracking
- beneath: “Hold a hologram between your hands” medium weight
- small muted line: “No app. No filter pack. Just a browser.” in #9a958c
Optional tiny mint #7dd3c0 accent mark (small diamond or underline) near the wordmark — restrained.

Style: premium product still, browser AR craft demo, quiet luxury tech, photographic hands + rendered hologram composite, high clarity, no clutter, no logo salad, no cyberpunk city, no robots. Generous margins; keep text inside safe zone. Cinematic low-key lighting; hologram is the brightest object.

Composition balance: hands + hologram occupy upper 60%; type sits in calmer lower band with subtle dark gradient scrim behind text for legibility.
```

**Negative prompt:**

```text
logo only, empty black poster, VR headset, robot hands, cartoon, anime, busy UI screenshot unreadable, neon rain, matrix code, stock handshake, app store frame, multiple logos, watermark, QR code, low-res, blurry, warped hands, extra fingers, text typos, centered tiny icon with huge empty margins only
```

### Image-generation prompt (OG — alternate foil-card)

```text
Open Graph image 1200×630 for HoloPinch. Dark stage #0a0a0c. Two hands pinch the four corners of a flat rectangular holographic foil card between them (parallelogram silhouette). Card is mostly opaque, magenta-core thin-film iridescence with cyan-yellow rim, thin white perimeter stroke only (no internal wires). Same typography lock: “HoloPinch” / “Hold a hologram between your hands” / “No app. No filter pack. Just a browser.” Quiet, craft-forward, high legibility, social-thumbnail readable.
```

---

## 11. Implementation notes (after assets exist)

Not part of image gen — for the agent who drops files in:

1. Replace `public/favicon.svg` (and optional PNGs)
2. Replace `public/og.png` (1200×630)
3. If apple-touch added, link in `index.html`
4. **No** `wrangler pages deploy` — commit + push; Cloudflare Pages Git build
5. Verify: `curl` 200 on `/favicon.svg` + `/og.png`; share debugger / Telegram link preview
6. Do not change product name or domain in meta without explicit Liz approval

---

## 12. `_templates` borrow map (this project)

| Asset | Path | Use here |
|---|---|---|
| Typography standard | `_templates/design-typography-font-preferences.md` | **Already applied:** Inter + IBM Plex Mono + CJK tail |
| Compact personal / craft tone | `_templates/design/liz-personal-compact/DESIGN.md` | Portfolio restraint; not the warm paper palette |
| Honest non-corporate copy | `_templates/design/lead-radar/DESIGN.md` | About voice only |
| Made-by credibility | `_templates/design/hanzilla-personal-site/DESIGN.md` | Attribution pattern (done in About) |
| Service comic landing | `_templates/design/uhoh-inspired-service-entry/` | **N/A** — wrong shape |
| Typing placeholder micro-pattern | `template/typing-placeholder-animation.md` | **N/A** — no input hero |

HoloPinch is a **dark-stage interactive toy**, not an editorial SaaS landing. Steal type discipline and honest copy; do **not** import lead-radar paper/Lora or uhoh comic systems into the stage UI.

---

## 13. Related docs

- `PRD.md` — product requirements, continuum, success/kill criteria  
- `docs/AUDIT.md` — audience-resonance audit (2026-07-28)  
- `NOTES.md` — working notes  
- `README.md` — controls table + run instructions  
