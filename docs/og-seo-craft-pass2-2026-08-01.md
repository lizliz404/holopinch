# OG craft — holopinch (PASS 2) — 2026-08-01

Method: hand SVG → `rsvg-convert -w 1200 -h 630` → `public/og.png`

## Source
- `scripts/og-craft/holopinch-og.svg`
- Brand lock from `docs/DESIGN.md` §10 + `src/style.css` (`#0a0a0c`, mint `#7dd3c0`, mesh iridescence)

## Shipped
- Replaced weak ~9KB logo-only `public/og.png` with hands + crystal-bar card (~136KB, 1200×630)
- `index.html`: absolute `og:image` / `twitter:image`, width/height/type/alt, `og:url`, `og:site_name`
- Title / description / canonical / robots already solid; left identity unchanged

## Re-rasterize
```bash
rsvg-convert -w 1200 -h 630 scripts/og-craft/holopinch-og.svg -o public/og.png
```

## Verify (after Hermes deploy)
```bash
file public/og.png   # 1200 x 630
curl -sI https://holopinch.lizliz.xyz/og.png | head
# share debugger / Telegram link preview
```

No commit / push / deploy from Cursor.
