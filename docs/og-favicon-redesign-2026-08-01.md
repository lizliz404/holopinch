# OG + favicon redesign — HoloPinch — 2026-08-01

## Final assets
| Path | Size | Notes |
|------|------|-------|
| `public/og.png` | 151070 B | **1200×630** RGB PNG (verified PIL + `file`) |
| `public/favicon.svg` | 539 B | Concentric teal diamond on `#0a0a0c` |
| `public/favicon-32.png` | ~0.8 KB | 32×32 |
| `public/apple-touch-icon.png` | ~3.9 KB | 180×180 |
| `public/favicon.ico` | ~1.4 KB | 16/32 from PNG |
| `scripts/og-craft/holopinch-og.svg` | master | Re-rasterize source |

## Re-rasterize
```bash
rsvg-convert -w 1200 -h 630 scripts/og-craft/holopinch-og.svg -o public/og.png
rsvg-convert -w 32 -h 32 public/favicon.svg -o public/favicon-32.png
rsvg-convert -w 180 -h 180 public/favicon.svg -o public/apple-touch-icon.png
```

## What changed vs previous
- Killed flesh-blob hands + purple/magenta crystal facets (AI-slop adjacent).
- New concept: MediaPipe-style landmark skeletons pinching a teal/mint mesh crystal-bar — product promise in one still.
- Palette locked to brand teal `#7dd3c0` / mint `#d8fff5` on void `#0a0a0c`.
- Type lockup centered, short: “HoloPinch” + one line.
- Full favicon set + `index.html` icon links.
- Cache-bust: `og.png?v=20260801b` on og/twitter image meta.

## Self-critique (3 bullets)
1. Landmark hands read as AR tracking at 600px and still as “hands + crystal” at ~200px — stronger than flesh blobs.
2. Teal-only crystal removes muddy iridescence; still a simple bar form (could later become a living mesh orb).
3. Skeleton can feel sparse vs photographic hands; intentional trade for craft clarity and brand fidelity.

## Verify
```bash
file public/og.png   # PNG image data, 1200 x 630
python3 -c "from PIL import Image; im=Image.open('public/og.png'); print(im.size)"
# After CF Pages deploy: curl -sI 'https://holopinch.lizliz.xyz/og.png?v=20260801b' | head
```

## Deploy
Git push to `main` only (CF Pages Git). No wrangler.

**Commit:** `5db9c5b` on `main` (pushed).
