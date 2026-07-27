# Reference recon — hand holographic mesh

Sources (saved):
- `ref-card-quad.jpg` — flat 4-corner pinch card
- `ref-crystal-bar.jpg` — elongated translucent faceted bar

These are **two poses / states of the same continuum**, not two products.

---

## Shared DNA (must keep across the continuum)

| Property | Spec |
|---|---|
| Hand model | Two hands only; object lives between them |
| Outline | Pure white, uniform, crisp; on ALL visible edges |
| Color language | Iridescent / spectral (magenta–cyan–lime–purple), high chroma |
| Composite | AR overlay on live camera plate; dark indoor bokeh bg |
| No cast shadow from the mesh onto body |

---

## Snapshot A — Card (`ref-card-quad.jpg`)

### Geometry
- **Flat plane, zero thickness** (no side faces, no bevel)
- Silhouette: wide parallelogram / mild trapezoid
- Aspect ≈ **2.1–2.3 : 1**
- Opposite angles roughly equal (~75° / ~105°)
- White stroke on **perimeter only** (no internal edges)

### Anchors (critical)
- **4 corner pinch**, not end-grip:
  - L index → top-left
  - L thumb → bottom-left
  - R index → top-right
  - R thumb → bottom-right
- Remaining fingers curled, not on shape
- Fingertips meet the white boundary; fill does **not** cover fingertips; fingertips do **not** cover interior

### Material
- **Fully opaque** (shirt completely hidden)
- **Smooth** holographic wash — **no facets**
- Hue map:
  - Top: yellow → lime → cyan
  - Core (largest): magenta / hot pink → purple
  - Bottom: deeper purple → blue-violet
- Glossy, low grain, soft sheen (thin-film / foil), not linear gradient only
- Stroke width ≈ **1.5–2.5% of shape height**, pure `#fff`, sharp corners, no glow halo

### Depth order
- Mesh in front of shirt
- Fingertips registered to corners (screen-space pin)

---

## Snapshot B — Crystal bar (`ref-crystal-bar.jpg`)

### Geometry
- **Shallow 3D solid**, not a card
- Outer silhouette: elongated hex / pointed-end lozenge
- Length:height ≈ **4–5 : 1**
- Thickness ≈ **0.25–0.33 × height** (flat bar, not square rod)
- Mid-body top/bottom nearly parallel → taper to blunt points at ends
- Outer vertices ~**12–16**
- Internal graph: long longitudinal ridges + denser triangles at ends
- Big central face(s) + high facet density at tips

### Anchors
- **End grip**, not 4-corner frame:
  - Hands wrap left/right tips only
  - Central span free
- Fingers **visible through** translucent mesh (tinted)
- Some finger segments behind wire, some in front of faces

### Material
- **High transparency** (shirt + neckline + fingers readable through body)
- Smooth **intra-facet** iridescence (not flat-shaded solid per tri)
- Hue map:
  - Left tip: magenta → purple → blue/cyan
  - Center: dominant **lime / cyan-green** large face
  - Right tip: yellow/orange → magenta → blue
- White wire on **outer + internal** edges, medium-thick, continuous across hand overlaps
- White edges stay opaque even when fill is translucent

---

## Continuum model (what "dynamic" means)

```
span small + coplanar pinch     span large + section depth
        │                              │
        ▼                              ▼
   SNAPSHOT A                     SNAPSHOT B
   flat opaque card               shallow translucent prism
   perimeter stroke only          full edge wireframe
   4 corner pins                  2 end grips
   smooth holo wash               faceted + internal ridges
```

**Deformation drivers (single system):**
1. `span` = distance between hand centroids → length, segment count, end taper
2. `section_depth` = finger spread / z-variance of tips → thickness + internal ridges
3. `coplanarity` = how planar the 4 pinch corners are → opacity↑ and internal edges↓ as it flattens
4. `grip_mode` emerges: when thumb+index of each hand form a clear quad and span is moderate → corner pins read as card; when hands slide to ends and section thickens → end grip prism

---

## Ranked clone priorities (gap vs current proto)

| # | Must-match | Current proto | Gap |
|---|---|---|---|
| 1 | Continuous pose→shape (not mode toggle) | Dynamic loft ✓ | OK |
| 2 | White edges always on | EdgesGeometry ✓ | Card state should drop *internal* edges → perimeter only |
| 3 | Opacity continuum: opaque card ↔ translucent bar | Fixed ~0.88 | **Drive opacity by coplanarity/span** |
| 4 | Card = smooth holo wash (no facet blocks) | Always faceted loft | **When flat, collapse to 2-tri quad + holo shader** |
| 5 | Bar = translucent + shirt show-through | Semi but dark bg hides it | Need live camera plate; lower opacity on bar |
| 6 | 4-corner pinch registration (card) | Uses thumb/index/middle/ring section | Prefer **strict 4 tips** when section_depth low |
| 7 | End taper + big center face (bar) | Caps + bulge partial | Boost tip taper + center face scale with span |
| 8 | Hue layout (magenta core card / green center bar) | Normal-RGB spectral-ish | Optional region bias in shader by loft U |
| 9 | Stroke weight ~2% of height | Fixed line width | Scale line width in screen space |
| 10 | No mesh shadow on body | OK | Keep |

---

## Shader takeaway (important correction)

Original prompt said "pure normal→RGB debug colors".  
**Refs partially disagree:**

- **Card**: smooth thin-film / holographic foil, region-biased hues, **not** hard faceted normal blocks
- **Bar**: faceted structure YES, but color still reads as **iridescent foil with intra-face gradients**, not chalky flat normal-RGB only

Best hybrid:
```
color = mix(normalRGB, thinFilm(fresnel, loftU, loftV), filmMix)
filmMix → 1 when flat/card, ~0.5–0.7 when thick/bar
opacity → 1 when flat, ~0.45–0.7 when thick
internalWire → 0 when flat, 1 when thick
```

---

## Fastest falsifiable next test (≤1 session)

1. Drive `flatness = 1 - clamp(section_depth / k + span*0.1, 0, 1)`
2. `opacity = mix(0.55, 1.0, flatness)`
3. `internalEdgeThreshold = mix(35, 12, 1-flatness)` (EdgesGeometry threshold)
4. When `flatness > 0.75`, render perimeter LineLoop from 4 pinch corners only (card stroke)
5. On camera: verify shirt show-through on bar pose and full hide on card pose

If that single parameter `flatness` can't hit both refs, the continuum hypothesis is wrong and we split materials — but refs strongly suggest one parameter is enough.
