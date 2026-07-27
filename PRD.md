# HoloPinch — Product Requirements

**Public name:** HoloPinch  
**Domain:** https://holopinch.lizliz.xyz  
**Repo path:** `/home/ubuntu/projects/holopinch`  
**One-liner:** Pinch the air. Hold a living holographic solid between your hands.

---

## 1. Why this exists

Viral AR “hand holographic object” demos look like magic. Mechanically they are:

1. Hand landmarks (MediaPipe)
2. Dynamic loft mesh between two hand sections
3. Iridescent shader + white edge stroke
4. Optional angle labels for a playful educational layer

HoloPinch is the polished, shareable, camera-first web toy that makes that continuum feel intentional — not a shader debug demo.

## 2. Audience & resonance

| Segment | Why they care | Hook |
|---|---|---|
| Short-video / AR curious | Looks like TikTok Effect House magic in browser | “Hold a hologram with your fingers” |
| Design / 3D curious | Instant mesh from body, zero assets | Normal→RGB + foil hybrid, free geometry |
| Teachers / STEM kids | Real-time angle readout on a gesture | Guess-the-angle mini game |
| Liz portfolio visitors | Proof of interactive craft on lizliz.xyz | Subdomain product, not a gist |

**Name rationale (`HoloPinch`):**
- **Holo** = the look people screenshot
- **Pinch** = the exact gesture in the reference photos (thumb + index corners)
- Short, speakable, product-true, works in EN/中文语境（「全息捏」）

## 3. Reference continuum (not two modes)

Saved refs:
- `src/assets/refs/ref-card-quad.jpg`
- `src/assets/refs/ref-crystal-bar.jpg`
- Full extraction: `src/assets/refs/RECON.md`

| Driver | → Card snapshot | → Crystal bar snapshot |
|---|---|---|
| span (hand distance) | smaller ~2.2:1 | larger ~4–5:1 |
| section depth / finger spread | thin / coplanar | shallow 3D thickness |
| opacity | **1.0 opaque** | **~0.45–0.7 translucent** (shirt/fingers show) |
| edges | **perimeter only** | outer + **all internal** facets |
| material | smooth thin-film foil | faceted foil w/ intra-face gradients |
| grip read | 4-corner pinch | end grips |

**Single control scalar:** `flatness ∈ [0,1]`  
Derived each frame from coplanarity of the 4 pinch corners + inverse span + inverse section depth.

```
opacity        = mix(0.55, 1.0, flatness)
internalWires  = flatness < 0.65
filmMix        = mix(0.45, 0.95, flatness)   // more smooth foil when flat
usePerimeterOnly = flatness > 0.75
segments/bulge scale with (1 - flatness) and span
```

## 4. Functional requirements

### P0 — Must ship
1. **Camera-first path** on HTTPS: one tap “Start camera”, MediaPipe Hands 2-hand tracking
2. **Demo fallback** (drag orbs) for no-camera / desktop QA
3. **Continuous dynamic loft** — no discrete Card/Prism mode toggle in primary UI
4. **`flatness` continuum** driving opacity, internal edges, shader film mix, section richness
5. **White edges** always; perimeter-only when flat; full EdgesGeometry when volumetric
6. **Two shaders** available: hybrid default (normalRGB × thin-film), pure holo, pure normal (dev)
7. **Angle interior labels** (bisector inset) toggle + optional guess mode
8. **Mobile usable**: large Start CTA, permission errors clear, portrait layout, handles not under HUD
9. **Production static build** via Vite → `dist/`, works on Cloudflare Pages
10. **SEO basics**: title, description, OG/Twitter, canonical `https://holopinch.lizliz.xyz/`, favicon, theme-color, robots allow

### P1 — Should ship
1. Landmark smoothing (One Euro or exp smooth) — silky, not jelly
2. Lost-hand hold (last good pose ~300–500ms) before mesh fades
3. Screen-space stroke width ≈ 2% of object screen height
4. Subtle landmark dots optional (debug off by default)
5. EN default UI copy; optional ZH toggle if cheap
6. `_headers` security + cache for assets
7. Share hint: “Screenshot & tag” microcopy (no backend)

### P2 — Nice
1. Record short clip (MediaRecorder) — only if trivial
2. Calibration mirror toggle
3. Angle quiz score streak

### Out of scope
- Accounts, backend, payments
- TikTok Effect House export
- Multiplayer
- Heavy postprocessing stacks

## 5. UX structure

```
┌─────────────────────────────────────────────┐
│  HoloPinch                    [EN|中] [?]   │  minimal top bar
│                                             │
│           [ live camera / dark stage ]      │
│              holographic mesh               │
│                                             │
│     (demo orbs only in demo mode)           │
│                                             │
│  [ Start camera ]   or status line          │  bottom primary CTA
│  Demo · Angles · Edges · Guess              │  secondary chips
└─────────────────────────────────────────────┘
```

Copy tone: sharp, playful, zero corporate. Pain-first optional secondary line:  
“No app. No filter pack. Just your hands and a browser.”

Empty/permission states:
- Camera blocked → explain + Demo button
- One hand only → “Show both hands”
- Loading model → determinate/indeterminate progress text

## 6. Technical architecture

```
src/
  main.ts          wire UI + loop
  hands.ts         MediaPipe HandLandmarker
  demo.ts          pointer demo hands
  geometry.ts      sections, loft, flatness, angles
  scene.ts         Three.js mesh/wire/labels project
  shaders.ts       normalRGB, holo, hybrid
  flatness.ts      derive flatness + material params  (new)
  ui.ts            HUD bindings (optional extract)
  style.css
  assets/refs/     reference stills + RECON.md
public/
  refs/            same refs if needed for about
  favicon.svg
  og.png           optional generated simple OG
  _headers
```

Stack: Vite + TypeScript + three + @mediapipe/tasks-vision  
No React required unless Cursor finds it cleaner — **prefer keep vanilla** for Pages simplicity.

Build:
```
npm run build  → dist/
```

CF Pages:
- Framework preset: none / Vite
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 22 if needed via env

## 7. Visual QA against refs

### Card pose pass criteria
- [ ] 4 pinch corners drive silhouette
- [ ] Appears flat, opaque over torso/bg
- [ ] Magenta-core / cyan-yellow rim foil wash (not chalky mono purple)
- [ ] White perimeter only, thin crisp
- [ ] Aspect roughly wide rectangle/parallelogram

### Bar pose pass criteria
- [ ] Elongated, tapered ends, shallow thickness
- [ ] Multi-hue facets, large center face bias toward green/lime OK
- [ ] Internal white edges visible
- [ ] Translucent — background bleeds through
- [ ] End-grip readable when hands at extremities

### Motion pass
- [ ] Dragging demo orbs continuously morphs card↔bar without mode switch
- [ ] No bow-tie flips; ring winding stable
- [ ] Smooth alpha tunable; default not jittery

## 8. SEO / share

| Field | Value |
|---|---|
| title | HoloPinch — Hold a hologram between your hands |
| description | Browser AR toy: pinch with both hands and a living holographic mesh appears between them. MediaPipe + WebGL. No app install. |
| canonical | https://holopinch.lizliz.xyz/ |
| og:image | /og.png (1200×630) or SVG fallback strategy |
| robots | index,follow |
| twitter:card | summary_large_image |

## 9. Success metrics (7-day falsifiers)

Ship is successful if:
1. `https://holopinch.lizliz.xyz` returns 200 with title HoloPinch
2. Cold load < ~3s on decent mobile network to interactive Demo
3. Camera path works on Chromium mobile + desktop HTTPS
4. One external human can understand the gesture without a manual (watch 5s)

Kill / pivot if:
- MediaPipe too slow/janky on mid mobile after smooth+hold tuning
- Users don’t understand two-hand requirement after UI copy pass

## 10. Deployment contract (Hermes-owned)

1. Code complete + `npm run build` green
2. `git init` / commit on `main`
3. Create GitHub repo `lizliz404/holopinch` (public)
4. `git push -u origin main` **first**
5. **Then** create Cloudflare Pages project `holopinch` GitHub-connected to that repo
6. Build: `npm run build`, output `dist`
7. Custom domain `holopinch.lizliz.xyz` + DNS CNAME proxied → `holopinch.pages.dev` (or assigned subdomain)
8. Verify live HTML markers + asset 200s

**Forbidden:** `wrangler pages deploy`, Direct Upload, empty commits as deploy triggers.

## 11. Implementation passes for Cursor

See `/tmp/holopinch-job.md`.
