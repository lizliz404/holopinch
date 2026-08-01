---
version: alpha
name: HoloPinch Visual System
description: >
  A dark full-viewport AR stage system for a browser hand-gesture toy — closer to
  a quiet instrument over a living holographic solid than to a SaaS landing or
  neon cyberpunk HUD. Inter carries all UI chrome (brand wordmark, body, pills);
  IBM Plex Mono is reserved for telemetry (angles, code, guess results). The
  surface model is near-black stage (#0a0a0c) with a soft radial vignette and
  hairline scanlines; chroma lives almost entirely in the WebGL mesh (spectral
  facets + thin-film), while chrome stays desaturated with a single mint live
  accent (#7dd3c0) and amber warn (#f0b429). Depth is frosted glass islands
  (backdrop-blur ~16px, translucent panels) floating over camera/mesh, not card
  grids or hard neobrutal offsets. Density is low-chrome: the mesh is the hero;
  brand and Dynamic-Island HUD recede when the hologram is live. Signature moves:
  (1) brand fades when mesh is active, (2) collapsed→expanded island HUD,
  (3) dual pinch orbs mint/amber, (4) white hologlass mesh edges.
source:
  - src/style.css
  - src/shaders.ts
  - index.html
  - docs/DESIGN.md
related:
  brand_brief: docs/DESIGN.md
live: https://holopinch.lizliz.xyz/
updated: 2026-08-02
colors:
  bg: "#0a0a0c"
  stage-mid: "#1a1a24"
  stage-edge: "#070709"
  panel: "rgba(12, 12, 16, 0.72)"
  island-bg: "rgba(12, 12, 16, 0.78)"
  line: "rgba(255, 255, 255, 0.14)"
  island-line: "rgba(255, 255, 255, 0.12)"
  text: "#e8e6e3"
  muted: "#9a958c"
  accent: "#7dd3c0"
  accent-soft: "rgba(125, 211, 192, 0.12)"
  accent-mid: "rgba(125, 211, 192, 0.14)"
  accent-strong: "rgba(125, 211, 192, 0.22)"
  accent-border: "rgba(125, 211, 192, 0.45)"
  accent-border-active: "rgba(125, 211, 192, 0.55)"
  on-accent: "#d8fff5"
  warn: "#f0b429"
  warn-soft: "rgba(240, 180, 41, 0.28)"
  scrim: "rgba(0, 0, 0, 0.28)"
  about-scrim: "rgba(0, 0, 0, 0.45)"
  tag-bg: "rgba(0, 0, 0, 0.55)"
  white-edge: "#ffffff"
  focus-ring: "rgba(125, 211, 192, 0.95)"
color-aliases:
  background: bg
  text-primary: text
  text-secondary: muted
  border: line
  live: accent
  caution: warn
typography:
  brand:
    fontFamily: "Inter, \"Noto Sans SC\", \"PingFang SC\", \"Microsoft YaHei\", system-ui, sans-serif"
    fontSize: "clamp(1.2rem, 3.8vw, 1.55rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
    color: "{colors.text}"
  brand-capture:
    fontFamily: "Inter, \"Noto Sans SC\", \"PingFang SC\", \"Microsoft YaHei\", system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 5vw, 2rem)"
    fontWeight: 700
    letterSpacing: "-0.04em"
  tagline:
    fontFamily: "Inter, \"Noto Sans SC\", \"PingFang SC\", \"Microsoft YaHei\", system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.35
    color: "{colors.muted}"
  body:
    fontFamily: "Inter, \"Noto Sans SC\", \"PingFang SC\", \"Microsoft YaHei\", system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
    color: "{colors.text}"
  status:
    fontFamily: "Inter, \"Noto Sans SC\", \"PingFang SC\", \"Microsoft YaHei\", system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.01em"
    color: "{colors.muted}"
  button:
    fontFamily: "Inter, \"Noto Sans SC\", \"PingFang SC\", \"Microsoft YaHei\", system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    letterSpacing: "0.01em"
  chip:
    fontFamily: "Inter, \"Noto Sans SC\", \"PingFang SC\", \"Microsoft YaHei\", system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    color: "{colors.muted}"
  about-title:
    fontFamily: "Inter, \"Noto Sans SC\", \"PingFang SC\", \"Microsoft YaHei\", system-ui, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 800
    letterSpacing: "-0.02em"
  about-kicker:
    fontFamily: "Inter, \"Noto Sans SC\", \"PingFang SC\", \"Microsoft YaHei\", system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.05em"
    textTransform: uppercase
    color: "{colors.accent}"
  mono-telemetry:
    fontFamily: "\"IBM Plex Mono\", \"JetBrains Mono\", \"SF Mono\", ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    fontVariantNumeric: tabular-nums
    color: "{colors.accent}"
  mono-warn:
    fontFamily: "\"IBM Plex Mono\", \"JetBrains Mono\", \"SF Mono\", ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    color: "{colors.warn}"
spacing:
  topbar-inset-x: "14px"
  topbar-inset-y: "12px"
  hud-bottom: "10px"
  island-pad-collapsed: "3px 5px 3px 8px"
  island-pad-expanded: "10px 12px 12px"
  island-gap-expanded: "8px"
  chip-gap: "6px"
  about-pad: "16px"
  safe-top: "env(safe-area-inset-top, 0px)"
  safe-bottom: "env(safe-area-inset-bottom, 0px)"
  island-collapsed-max: "min(196px, calc(100vw - 48px))"
  island-expanded-max: "min(360px, calc(100vw - 20px))"
  island-collapsed-max-desktop: "min(220px, calc(100vw - 48px))"
  island-expanded-max-desktop: "min(400px, calc(100vw - 24px))"
radii:
  island-collapsed: "9999px"
  island-expanded: "18px"
  pill: "999px"
  button: "10px"
  input: "8px"
  panel: "16px"
  demo-handle: "50%"
shadows:
  island-collapsed: "0 6px 24px rgba(0, 0, 0, 0.35)"
  island-expanded: "0 10px 32px rgba(0, 0, 0, 0.4)"
  about-sticky-foot: "0 -8px 16px rgba(12, 12, 16, 0.9)"
  brand-text: "0 1px 12px rgba(0, 0, 0, 0.55)"
  demo-handle-ring: "0 0 0 1px rgba(0, 0, 0, 0.4)"
blur:
  island: "16px"
  about: "16px"
borders:
  hairline: "1px solid {colors.line}"
  island: "1px solid {colors.island-line}"
  tag: "1px solid rgba(255, 255, 255, 0.35)"
  handle: "2px solid rgba(255, 255, 255, 0.85)"
  handle-right: "2px solid {colors.warn}"
motion:
  island-max-width: "0.24s ease"
  island-radius: "0.22s ease"
  island-pad: "0.22s ease"
  island-shadow: "0.22s ease"
  brand-fade: "0.55s ease"
  scrim: "0.28s ease"
  about-transform: "0.3s cubic-bezier(0.2, 0.9, 0.25, 1.1)"
  button: "0.2s ease"
  reduced-motion: "respect prefers-reduced-motion — disable chrome transitions"
canvas:
  width: "100vw"
  height: "100vh"
  overflow: hidden
  color-scheme: dark
components:
  stage:
    background: "radial-gradient(ellipse at 50% 38%, {colors.stage-mid} 0%, {colors.stage-edge} 68%) + 1px scanlines rgba(255,255,255,0.012)"
    description: "Full-viewport #app stage under video + WebGL overlay. Not a marketing section stack."
  video-mirror:
    opacity: 0.62
    transform: "scaleX(-1)"
    description: "Live camera feed mirrored; only shown with .live. Product is mesh over this, not the feed alone."
  topbar-brand:
    typography: "{typography.brand}"
    position: "top-left absolute"
    description: "Wordmark + optional tagline. Fades hard when data-brand=active (mesh live)."
  dynamic-island-hud:
    background: "{colors.island-bg}"
    border: "{borders.island}"
    blur: "{blur.island}"
    description: "Bottom-center collapsed pill ↔ expanded control sheet. Primary chrome atom of the product."
  primary-cta:
    background: "{colors.accent-mid}"
    borderColor: "{colors.accent-border}"
    color: "{colors.on-accent}"
    borderRadius: "{radii.button}"
    description: "Full-width Start/Stop camera. Mint outline glass, never solid SaaS blue fill."
  chip:
    borderRadius: "{radii.pill}"
    description: "Mode toggles (Demo/Angles/Edges/Guess/Shade). Active = mint border + accent-soft fill + accent text."
  angles-readout:
    typography: "{typography.mono-telemetry}"
    description: "Centered mono tabular angle string in accent mint. Empty = hidden."
  angle-tag:
    typography: "{typography.mono-telemetry}"
    background: "{colors.tag-bg}"
    borderRadius: "{radii.pill}"
    description: "Projected mono pills at interior bisectors on the mesh stage."
  demo-handle-left:
    size: "36px (42px mobile)"
    background: "rgba(125, 211, 192, 0.28)"
    border: "{borders.handle}"
    description: "Left pinch orb — mint fill + white ring."
  demo-handle-right:
    size: "36px (42px mobile)"
    background: "{colors.warn-soft}"
    border: "{borders.handle-right}"
    description: "Right pinch orb — amber fill + warn ring. Pair is non-optional in demo mode."
  about-panel:
    background: "{colors.panel}"
    borderRadius: "{radii.panel}"
    blur: "{blur.about}"
    description: "Centered glass dialog; sticky attribution foot; kickers use about-kicker uppercase mint."
  webgl-fallback:
    description: "Centered glass card on bg when WebGL missing — same panel language, no alternate palette."
  focus-ring:
    outline: "2px solid {colors.focus-ring}"
    outlineOffset: "2px"
    description: "Only :focus-visible. No permanent focus chrome."
---

# HoloPinch — Visual System (Genre A)

> Implementation SSOT for coding agents. Tokens extracted from `src/style.css`, `src/shaders.ts`, `index.html`.  
> Brand / distribution / favicon·OG·motion briefs stay in [`docs/DESIGN.md`](./DESIGN.md) — do not replace that file with this one.

> **DESIGN.md quality audit** · 2026-08-02 · gold: beautiful-html-templates/soft-editorial  
> - **Genre:** A visual-system (app-shell / AR stage)  
> - **Grade A (UI system):** 8.5/10 — full YAML roles + Signature Treatments + Defaults + CJK + Iteration + Known Gaps; grounded in live CSS  
> - **Grade B (brand brief):** n/a here — see `DESIGN.md` (B ≈ 9/10)  
> - **Verdict:** split-complete · keep pair in sync when tokens change in CSS  

---

## Overview

HoloPinch UI is a **single full-viewport instrument**, not a multi-section marketing site. The cultural register is quiet craft demo: dark stage, frosted glass chrome, one mint “live” accent, and a WebGL solid that carries all the spectacle. It is closer to a field instrument resting on a hologram than to Linear/Stripe landing chrome or cyberpunk HUD overload.

**Density philosophy — low chrome, high mesh.**  
A broken layout is either (a) chrome competing with the mesh (bright panels, busy top bars, permanent taglines while live), or (b) empty black with no readable gesture affordance (missing dual orbs in demo, no status). Default: mesh owns the center; HUD is a bottom island; brand whispers then almost vanishes when active.

**Key Characteristics:**

- Near-black stage (`#0a0a0c`) + soft radial vignette + hairline horizontal scanlines
- Camera feed mirrored at 0.62 opacity when live — never full-opacity selfie UI
- Inter for all prose chrome; IBM Plex Mono only for numbers/code/telemetry
- Single mint accent for live/active; amber only for warn / right-hand affordance
- Dynamic Island HUD: collapsed pill ↔ expanded sheet (radius 9999px → 18px)
- Brand wordmark top-left fades to ~0.18 opacity when mesh is active
- Frosted panels: `backdrop-filter: blur(16px)`, translucent `rgba(12,12,16,*)`
- Mesh edges white / high opacity (“hologlass”); shader chroma is spectral, not flat brand swatches
- Dual demo pinch orbs: left mint, right amber — always paired in demo
- Safe-area aware; `overflow: hidden` on html/body; no document scroll
- `html.capture-clean` mode strips chrome for motion/OG capture

---

## Colors

### Palette

| Token | Value | Job |
|---|---|---|
| `bg` | `#0a0a0c` | Page / theme-color / fallback void |
| `stage-mid` → `stage-edge` | `#1a1a24` → `#070709` | Radial vignette on `#app` |
| `panel` / `island-bg` | `rgba(12,12,16,0.72–0.78)` | Glass surfaces |
| `line` / `island-line` | white @ 0.14 / 0.12 | Hairline borders |
| `text` | `#e8e6e3` | Primary ink (warm off-white) |
| `muted` | `#9a958c` | Status, secondary, idle chips |
| `accent` | `#7dd3c0` | Live mint — active, links, mono telemetry, focus |
| `on-accent` | `#d8fff5` | Text on mint-tinted primary CTA |
| `warn` | `#f0b429` | Guess result + right demo handle only |
| Scanline | white @ 0.012 | Stage texture, not a brand color |

### Hologram chroma (shader — not UI swatches)

From `src/shaders.ts` hybrid/default path:

- **Card / foil pole (flatness↑):** magenta core hue ~0.82–0.92, cyan–yellow rim wash, higher film mix
- **Bar / crystal pole (flatness↓):** multi-facet spectral; center face bias lime/cyan-green hue ~0.38; opacity often 0.55–0.7 so stage bleeds through
- **Edges:** near-white stroke @ high opacity — the “hologlass” read
- Normal→RGB base always under film so facets read as **hard planes**, not soft gradient blobs

UI must **not** duplicate the full rainbow in chrome. Chrome stays desaturated; mesh owns chroma.

### Defaults

- Default surface: `bg` + stage gradient (never pure `#000` marketing void without vignette)
- Default primary text: `text`
- Default secondary text: `muted`
- Default “something is live/selected”: `accent` border + `accent-soft` fill
- Default caution / opposing hand: `warn` — do not use for primary CTA
- Default focus: `focus-ring` mint outline, offset 2px, `:focus-visible` only

### Color principles

- One live accent. No second “brand purple.”
- `warn` is not “error red SaaS” — it is amber affordance / score
- Never paint large solid mint fills; use translucent mint on dark glass
- Desaturation test for marks: geometry must survive without chroma

---

## Typography

### Font Family

| Role | Stack | Weights in product |
|---|---|---|
| UI / brand / body | Inter + Noto Sans SC / PingFang SC / Microsoft YaHei + system-ui | 400, 600, 700, 800 |
| Telemetry / code | IBM Plex Mono + JetBrains Mono + SF Mono + ui-monospace | 400, 500 |

Load (from `index.html`): Google Fonts `Inter:400;600;800` + `IBM+Plex+Mono:400;500`, `display=swap`, preconnect.

**Crossing rails is forbidden:** body copy in mono; angle strings in Inter; decorative display serifs; bare `sans-serif` / Segoe-led stacks.

### Type Scale

| Token | Size | Weight | Tracking | Use |
|---|---|---|---|---|
| brand | clamp(1.2rem, 3.8vw, 1.55rem) | 700 | -0.03em | Topbar wordmark |
| brand-capture | clamp(1.5rem, 5vw, 2rem) | 700 | -0.04em | `capture-clean` only |
| tagline | 12px | 400 | — | Under brand; hidden when active/idle-collapsed logic |
| status | 11px (12px expanded) | 500 | 0.01em | Island status ellipsis |
| button / primary | 14px | 600 | 0.01em | CTA |
| chip | 12px | 400 | — | Mode pills |
| about-title | 1.1rem | 800 | -0.02em | Dialog H2 |
| about-kicker | 11px | 600 | 0.05em | Dialog H3 uppercase mint |
| body / about | 13px | 400 | — | Dialog body |
| mono-telemetry | 12px | 400 | tabular-nums | Angles readout, angle tags, code |
| mono-warn | 12px | 400 | — | Guess result |

### Defaults

- Section chrome headlines inside About → `about-title` / `about-kicker`
- Any live numeric readout → `mono-telemetry` + accent color
- Any primary action label → `button` weight 600, never light 300

### Signature Treatments

These treatments are **non-optional** whenever the corresponding element type is used:

1. **Active brand hush** — When mesh/algo is live (`#topbar[data-brand='active']`), wordmark drops to **opacity ~0.18**, loses extra glow/animation, tagline **fully collapses** (height 0, opacity 0). Do not keep a loud logo over a live hologram.

2. **Dynamic Island morph** — HUD collapsed = pill (`border-radius: 9999px`, tight max-width ~196–220px). Expanded = sheet (`18px` radius, width ~360–400px, pad 10–12px, gap 8px). Chevron rotates 45°→225°. Same component, two states — do not swap in a second unrelated panel style.

3. **Dual pinch orbs** — Demo mode always shows **paired** handles: left mint fill + white ring; right amber fill + `#f0b429` ring; 36px desktop / 42px mobile hit targets. Never monochrome twins; never a single orb.

4. **Mint = live** — Active chip, primary CTA edge, angles mono, About kicker, focus ring, open About button: all mint family. Idle chrome stays `muted` + hairline white.

5. **Mono telemetry only for numbers/code** — Angle tags, angles readout, guess result, `code` in About. No Inter on degree strings.

6. **Hologlass edge** — Mesh silhouette reads with near-white hard edges; UI must not steal that with thick white panel chrome.

### Typography Principles

- Tracking tight on brand only (−0.03 to −0.04em); body stays neutral
- Uppercase + wide tracking **only** on About kickers (11px / 0.05em) — not on HUD status
- Text shadows on topbar for legibility over video; removed when brand is active/faded
- No gradient text fills on wordmark in product UI (capture mode also solid `text`)

---

## Layout

### Canvas System

- `html, body, #app`: 100% × 100%, `overflow: hidden`
- Layers (bottom → top): stage gradient → `#video` → `#overlay` (WebGL) → scrims/tags → topbar/HUD → about
- Absolute positioning for chrome; no document flow sections, no marketing grid
- `touch-action: none` on overlay; gesture canvas is the product

### Padding and Gap Scale

| Token | Value | Use |
|---|---|---|
| topbar inset | 14px × (12px + safe-top) | Brand block |
| hud bottom | 10px + safe-bottom (8px on small) | Island |
| island collapsed pad | 3px 5px 3px 8px | Pill density |
| island expanded pad | 10px 12px 12px | Controls |
| chip gap | 6px | Mode row |
| about pad | 16px | Dialog |

### Chrome Frame

| Element | Behavior |
|---|---|
| Topbar | Top-left, `pointer-events: none`, max-width ~320px |
| HUD island | Bottom-center, `translateX(-50%)`, primary interactive chrome |
| About | Center modal + backdrop; z-index 9–10 |
| Capture-clean | Hides tagline + `.capture-hidden`; centers larger brand; dims demo handles to 0.35 |

Persistent chrome is **minimal**. No nav bar, no footer bar, no pricing ribbon.

---

## Depth and Elevation

Single depth model: **frosted glass over dark stage**.

| Level | Treatment |
|---|---|
| 0 Stage | Opaque near-black + vignette + scanlines |
| 1 Video | Dimmed mirrored feed |
| 2 Mesh | Transparent/translucent WebGL in stage space |
| 3 Scrim | `rgba(0,0,0,0.28–0.45)` when HUD/about needs focus |
| 4 Glass | `panel` / `island-bg` + `blur(16px)` + hairline border + soft drop shadow |
| 5 Tags/handles | Higher z; tags use solid dark pill; handles are opaque-enough orbs |

**Do not introduce:** hard neobrutal offset shadows, colored glows on every button, material-elevated white cards, or multi-stop glassmorphism stacks.

About sticky attribution uses a near-opaque `rgb(12,12,16)` foot + upward shadow so scroll content doesn’t collide — exception that stays in the same ink family.

---

## Shapes and Treatment

### Border Radius

| Value | Use |
|---|---|
| 9999px / 999px | Collapsed island, chips, angle tags, icon buttons, stop pill |
| 18px | Expanded island |
| 16px | About panel, WebGL fallback card |
| 10px | Default buttons |
| 8px | Number inputs |
| 50% | Demo handles |

### Border Weights

- Default chrome: **1px** hairline `line` / `island-line`
- Demo handles: **2px** solid ring
- Angle tags: 1px `rgba(255,255,255,0.35)`
- Active mint: border color shifts to accent family, still 1px

### Decorative Element Types

- Stage scanlines (CSS repeating-linear-gradient)
- Island chevron (CSS borders, not icon font)
- Dual pinch orbs
- Angle mono pills
- Optional mesh white edges (renderer)
- Iconify translate glyph on lang button (15px) — icons otherwise sparse

---

## Do's and Don'ts

### Do

- Keep chrome quieter than the mesh at all times
- Use mint only for live/selected/focus/telemetry
- Pair demo orbs mint/amber
- Fade brand when `data-brand='active'`
- Respect safe-area insets and `viewport-fit=cover`
- Use `capture-clean` for motion/OG masters (`/?motion=1` path)
- Extract new tokens from CSS — update this file when CSS changes
- Prefer translucent fills over solid saturated blocks

### Don't

- Build a multi-section landing inside this shell without a separate page system
- Add a second accent purple/pink to UI chrome because the shader has magenta
- Use Inter for degree readouts or mono for brand wordmark
- Keep full-opacity tagline during live mesh
- Use bounce/spring SaaS button motion; chrome easing stays short ease / one about overshoot curve
- Show naked debug telemetry outside debug modes
- Invent light-theme tokens without a full redesign pass
- Copy Soft Editorial pastels or cream paper into this product

---

## Responsive Behavior

### Scaling Behavior

- Fluid brand via `clamp`; island max-widths via `min(..., 100vw - N)`
- Desktop fine pointer ≥768px: slightly roomier island (220/400), 30px icon hits, lang button can pad horizontally
- ≤480px: hide tagline; brand ~1.15rem; larger 42px handles; expanded HUD max-height ~40vh with scroll

### Presenter / Capture Behavior

- `html.capture-clean`: product-as-hero frame; chrome stripped; brand centered and larger
- Motion loops: prefer silent autoplay readability of hands → mesh in 3s (see brand brief P0)

### Reduced motion

- `#hud`, chevron, topbar transitions → `none` under `prefers-reduced-motion: reduce`
- Mesh motion is product-critical; chrome must still honor reduced-motion for UI transitions

### Print

- Not supported; no print stylesheet (Known Gap)

---

## CJK & International Content

Product is **bilingual EN default + zh** (`src/i18n.ts`, hreflang en/zh).

### Recommended Chinese Pairing

| Role | Latin | Chinese | Notes |
|---|---|---|---|
| UI / brand | Inter | Noto Sans SC / PingFang SC / Microsoft YaHei | Already in `font-family` stack |
| Telemetry | IBM Plex Mono | Same mono (digits universal) | Avoid full-width digits |

### Mixed-Content Strategy

- EN default strings; zh via in-place swap (no reload — keep WASM/camera warm)
- Keep About and status strings short in both languages; island width is tight when collapsed
- Don’t title-case English habits onto Chinese labels

### Loading

```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
```

Noto Sans SC is named in CSS stack but **not** explicitly loaded via Google Fonts in `index.html` — system PingFang/YaHei cover most devices; Noto may FOUT if missing (Known Gap).

### Universal CJK Adjustments

- Line-height ≥1.35 on tagline/body; avoid negative tracking on Chinese runs
- No `text-transform: uppercase` on Chinese kickers (About H3 is uppercase Latin section labels — provide zh forms that don’t rely on uppercase)
- Pangu spacing for mixed EN+zh where copy is long (About)
- Tabular mono nums stay ASCII digits

### Aesthetic Notes for This System

- Signature “brand hush” and island morph are language-agnostic
- Mono mint angles work identically in zh UI
- Collapsed island must still fit zh status strings — prefer concise verbs

### Known CJK Gap

- Inter 800 About titles don’t have a matched SC display cut loaded; SC falls back to Noto/PingFang weight approximation
- Uppercase About kickers are Latin-pattern; zh section labels should use weight/color (mint) not uppercase tracking as the signal
- Long zh status in collapsed pill will ellipsis faster than EN — copy must stay short

---

## Iteration Guide

When adding UI, obey these additive rules:

1. **Any new surface** uses `panel` / `island-bg` + 1px hairline + optional blur(16px) — no new elevation language.
2. **Any new live/selected state** uses mint border/fill tokens already defined — no new accent hex.
3. **Any new numeric readout** uses `mono-telemetry` + accent (or `mono-warn` only for guess/score).
4. **Any new floating control** prefers island citizenship (inside HUD) over corner browsers chrome.
5. **Any new demo affordance** must not break dual-orb mint/amber pairing.
6. **Any new topbar content** must participate in active hush (fade/hide when mesh live).
7. **Any new motion on chrome** ≤ ~0.3s ease; honor `prefers-reduced-motion`.
8. **Any token change** lands in `src/style.css` first, then this file — never invent hex only here.
9. **Distribution stills/motion** follow `docs/DESIGN.md` P0 motion > OG > favicon; use `capture-clean`.
10. **No marketing sections** (pricing, logos cloud, feature grid) inside `#app` shell without an explicit product decision.

---

## Known Gaps

- Noto Sans SC referenced in CSS but not in Google Fonts `<link>` — rely on system SC fonts
- No light theme / high-contrast theme tokens
- No print CSS
- Brand brief type sizes in `DESIGN.md` slightly lag CSS clamps (e.g. brand clamp values) — **this file wins for implementation**; reconcile tables when editing CSS
- Shader chroma is intent-level documentation; exact frame looks depend on flatness/film uniforms at runtime
- Attract-loop / idle animation polish called out as P1 in brand brief — not fully specified as chrome motion here
- `design.md` lint CLI optional; YAML is hand-maintained
- About panel copy structure is HTML in `index.html` — not componentized design tokens beyond type/color
- Desktop vs mobile island widths differ; tablet middle ground uses mobile-ish defaults outside the fine-pointer media query
- No dedicated skeleton/loading shimmer system beyond brand `data-brand='loading'` opacity

---

## File map (agents)

| Need | File |
|---|---|
| Implement / restyle UI | **this file** + `src/style.css` |
| Brand voice, motion/OG/favicon prompts | `docs/DESIGN.md` |
| Shader look | `src/shaders.ts` |
| Strings EN/zh | `src/i18n.ts` |
| Audience / distribution priority rationale | `docs/AUDIT-audience-resonance-v2.md` |
