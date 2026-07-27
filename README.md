# HoloPinch

Pinch the air with both hands and a living holographic solid appears between them — MediaPipe hand tracking + WebGL in a plain browser tab. No app install, no account, no backend. Shape, opacity, and edges ride one continuous **flatness** continuum (opaque foil card ↔ translucent crystal bar).

**Live:** https://holopinch.lizliz.xyz/

<!-- screenshot: docs/hero.png -->

## Controls

| Input | Desktop | Touch |
|---|---|---|
| Move hands | Drag the orbs | Drag the orbs |
| Pinch open | Scroll wheel | Two-finger vertical drag |
| Finger spread | Shift + scroll | Two-finger horizontal drag |
| Camera | Start camera → pinch thumb+index | Same |

## Stack

Vite · TypeScript · three.js · MediaPipe HandLandmarker (lazy-loaded on camera start)

## Run / build

```bash
npm install
npm run dev    # http://localhost:5188
npm run build  # → dist/
```

Camera needs **HTTPS** (or localhost). If permission is blocked, use Demo.

## Deploy

Cloudflare Pages, Git-connected (build on push). No direct upload.

## License

MIT — see `LICENSE`.
