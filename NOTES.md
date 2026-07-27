# HoloPinch — notes

## Question this answers
Can we get a *continuous*, hand-driven holographic solid (not two fixed presets) with MediaPipe + Three.js in a throwaway afternoon?

## Verdict
Yes. One dynamic loft between left/right finger-tip sections is enough.

- Snapshots that look like a "flat card" vs "crystal bar" are just different poses of the same mesh:
  - hands closer / sections flatter → card-like silhouette
  - hands pulled apart + finger spread → elongated faceted prism (segment count + bulge grow with span)
- Normal→RGB (+ chroma kick) gives free multi-hue facets without textures
- White `EdgesGeometry` wireframe sells the AR sticker look
- Interior angle labels (bisector inset) are cheap and educational
- Guess-the-angle mode is a one-state UI add-on

## Run
```bash
cd /home/ubuntu/projects/holopinch
npm run dev   # http://localhost:5188
```

Demo: drag the two orbs. Wheel = pinch open. Shift+wheel = finger spread.
Camera: MediaPipe Hands via `@mediapipe/tasks-vision` (needs HTTPS or localhost + permission).

## Kill / next
- Kill if real-hand latency or landmark jitter ruins the "silk" feel on device.
- Next product fork worth testing: gesture protractor mini-game (guess → reveal), not more geometry modes.
