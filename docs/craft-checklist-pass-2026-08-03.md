# Craft checklist pass — 2026-08-03

Product: **HoloPinch** (`holopinch.lizliz.xyz`)  
Type: **AR toy / interactive single-screen landing**  
Starter: 附 A **light** (progress + noise + selection + prm + scrollbar); skip chapter dots if short; loading honesty

## Already present

- Stage-aware hand-model / camera status strings (`main.ts` + worker progress)
- Camera / model error copy with next action (Demo orbs / Retry)
- OG + Twitter cards + JSON-LD
- `prefers-reduced-motion` on brand/HUD transitions; intro attract skipped when reduced
- `:focus-visible` teal outline
- Capture-clean mode for motion recording (`/?motion=1`)

## Implemented this pass

| Item | Files |
|---|---|
| 附 A: top progress bar | `src/styles/premium-one-pager.css`, `src/lib/premium-one-pager.ts`, wired in `src/main.ts` |
| 附 A: SVG noise overlay (dark `overlay` blend) | same |
| 附 A: `::selection` + thin scrollbar + smooth scroll + prm kill-switch | same (brand tokens: teal `#7dd3c0` → amber `#f0b429`) |
| Skip chapter dots | `initPremiumOnePager({ enableChapters: false })` — single-screen, `overflow: hidden` |
| Skip reveal on hero | `enableReveal: false` — protect LCP brand |
| Loading honesty (labor-illusion stages) | `src/i18n.ts` en/zh stage + short labels |
| Capture-clean hides craft chrome | `src/style.css` |
| Micro press feedback (≤100ms) | `src/style.css` `button:active` + prm off |

## Explicitly skipped

- **Chapter dots** — page has no long scroll / &lt;3 sections; toy stage is full-viewport
- **pop-reveal** — no narrative below-fold sections; about is a modal with its own fade
- **Scroll progress usefulness** — body scroll ≈ 0; bar still mounts for pack consistency / future scroll surfaces (about panel is nested overflow). Dormant on main stage is acceptable
- Full 附 A package, OG regen, undo/autosave, Cmd+K — wrong product stage

## Residual P2/P3 (do not implement now)

- Bind progress to `#about-panel` nested scroller if About content grows
- Optional one-shot reveal inside About headings only
- Stronger first-paint status before auto-camera (skeleton island) — low ROI vs current stage strings
- Motion asset / OG still higher distribution priority than chrome polish (`docs/DESIGN.md` §0)
