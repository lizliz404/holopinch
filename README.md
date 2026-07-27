# HoloPinch

Hold a living holographic solid between your hands in the browser.

Pinch with both hands (or drag the Demo orbs). Shape, opacity, and edges morph on a single **flatness** continuum — flat opaque card ↔ translucent crystal bar. No Card/Prism mode toggle.

**Live:** https://holopinch.lizliz.xyz/

## Run

```bash
npm install
npm run dev    # http://localhost:5188
npm run build  # → dist/
```

## Camera note

Camera requires **HTTPS** (or localhost). Allow permission when prompted. If blocked, use **Demo** — drag the two orbs; scroll adjusts pinch opening, Shift+scroll adjusts finger spread.

Stack: Vite + TypeScript + Three.js + MediaPipe Hands (CDN wasm/model).
