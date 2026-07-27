import * as THREE from 'three';

export type MaterialParams = {
  flatness: number;
  opacity: number;
  filmMix: number;
  internalWires: boolean;
  usePerimeterOnly: boolean;
  edgeThreshold: number;
  bulgeScale: number;
  minSegments: number;
  maxSegments: number;
};

/**
 * Coplanarity of 4 pinch corners: 1 = perfectly coplanar, 0 = strongly 3D.
 * Uses volume of tetrahedron / mean edge length.
 */
export function coplanarityOfQuad(corners: THREE.Vector3[]): number {
  if (corners.length < 4) return 0;
  const [a, b, c, d] = corners;
  const ab = new THREE.Vector3().subVectors(b, a);
  const ac = new THREE.Vector3().subVectors(c, a);
  const ad = new THREE.Vector3().subVectors(d, a);
  const vol = Math.abs(ab.dot(new THREE.Vector3().crossVectors(ac, ad))) / 6;
  const meanEdge =
    (a.distanceTo(b) +
      b.distanceTo(c) +
      c.distanceTo(d) +
      d.distanceTo(a) +
      a.distanceTo(c) +
      b.distanceTo(d)) /
    6;
  if (meanEdge < 1e-6) return 1;
  const normalized = vol / (meanEdge * meanEdge * meanEdge);
  return THREE.MathUtils.clamp(1 - normalized * 18, 0, 1);
}

/** RMS distance of points from best-fit plane through centroid (section depth). */
export function sectionDepth(points: THREE.Vector3[]): number {
  if (points.length < 3) return 0;
  const c = new THREE.Vector3();
  for (const p of points) c.add(p);
  c.multiplyScalar(1 / points.length);

  // Covariance-ish: use cross of two spanning vectors as plane normal proxy
  let n = new THREE.Vector3();
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const a = new THREE.Vector3().subVectors(points[i], c);
    const b = new THREE.Vector3().subVectors(points[j], c);
    n.add(new THREE.Vector3().crossVectors(a, b));
  }
  if (n.lengthSq() < 1e-10) {
    n.set(0, 0, 1);
  } else {
    n.normalize();
  }

  let sum = 0;
  for (const p of points) {
    const d = new THREE.Vector3().subVectors(p, c).dot(n);
    sum += d * d;
  }
  return Math.sqrt(sum / points.length);
}

/**
 * Derive flatness ∈ [0,1] and material/geometry params from live pose.
 * High flatness → opaque card; low → translucent volumetric bar.
 */
export function deriveMaterialParams(opts: {
  corners: THREE.Vector3[];
  leftRing: THREE.Vector3[];
  rightRing: THREE.Vector3[];
  span: number;
}): MaterialParams {
  const { corners, leftRing, rightRing, span } = opts;
  const coplanar = coplanarityOfQuad(corners);
  const depth =
    (sectionDepth(leftRing) + sectionDepth(rightRing)) * 0.5 +
    sectionDepth(corners) * 0.35;

  // Span reference ~0.8–1.6 scene units for card→bar
  const spanTerm = THREE.MathUtils.clamp(span * 0.22, 0, 1);
  const depthTerm = THREE.MathUtils.clamp(depth / 0.18, 0, 1);

  const raw =
    coplanar * 0.55 + (1 - spanTerm) * 0.25 + (1 - depthTerm) * 0.2;
  const flatness = THREE.MathUtils.clamp(raw, 0, 1);

  const opacity = THREE.MathUtils.lerp(0.55, 1.0, flatness);
  const filmMix = THREE.MathUtils.lerp(0.45, 0.95, flatness);
  const internalWires = flatness < 0.65;
  const usePerimeterOnly = flatness > 0.75;
  const edgeThreshold = THREE.MathUtils.lerp(35, 12, 1 - flatness);
  const bulgeScale = THREE.MathUtils.lerp(1.15, 0.08, flatness);
  const minSegments = Math.round(THREE.MathUtils.lerp(5, 2, flatness));
  const maxSegments = Math.round(THREE.MathUtils.lerp(14, 4, flatness));

  return {
    flatness,
    opacity,
    filmMix,
    internalWires,
    usePerimeterOnly,
    edgeThreshold,
    bulgeScale,
    minSegments,
    maxSegments,
  };
}
