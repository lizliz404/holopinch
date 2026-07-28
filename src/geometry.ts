import * as THREE from 'three';

export type Landmark = { x: number; y: number; z: number };

/** Max non-indexed vertices for dynamic loft (4 tips × 14 segs × 4 tris × 3 + caps). */
export const LOFT_MAX_VERTS = 2048;
/** Max line endpoints for procedural wire (pairs stored sequentially). */
export const WIRE_MAX_POINTS = 512;

/** Map normalized landmark → Three scene coords. */
export function landmarkToScene(
  p: Landmark,
  aspect: number,
  mirrorX: boolean,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  const xN = mirrorX ? 1 - p.x : p.x;
  const x = (xN - 0.5) * 2 * aspect;
  const y = -(p.y - 0.5) * 2;
  const z = -p.z * 2.5;
  return out.set(x, y, z);
}

function writeTri(
  positions: Float32Array,
  normals: Float32Array,
  loftUs: Float32Array,
  vi: number,
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  u0: number,
  u1: number,
  u2: number,
  scratchE1: THREE.Vector3,
  scratchE2: THREE.Vector3,
  scratchN: THREE.Vector3,
): number {
  scratchE1.subVectors(p1, p0);
  scratchE2.subVectors(p2, p0);
  scratchN.crossVectors(scratchE1, scratchE2);
  if (scratchN.lengthSq() < 1e-12) return vi;
  scratchN.normalize();
  if (vi + 3 > LOFT_MAX_VERTS) return vi;
  let o = vi * 3;
  positions[o] = p0.x;
  positions[o + 1] = p0.y;
  positions[o + 2] = p0.z;
  positions[o + 3] = p1.x;
  positions[o + 4] = p1.y;
  positions[o + 5] = p1.z;
  positions[o + 6] = p2.x;
  positions[o + 7] = p2.y;
  positions[o + 8] = p2.z;
  for (let k = 0; k < 3; k++) {
    const no = (vi + k) * 3;
    normals[no] = scratchN.x;
    normals[no + 1] = scratchN.y;
    normals[no + 2] = scratchN.z;
  }
  loftUs[vi] = u0;
  loftUs[vi + 1] = u1;
  loftUs[vi + 2] = u2;
  return vi + 3;
}

function ringCentroid(ring: THREE.Vector3[], out = new THREE.Vector3()): THREE.Vector3 {
  out.set(0, 0, 0);
  for (const p of ring) out.add(p);
  return out.multiplyScalar(1 / Math.max(ring.length, 1));
}

/** Order a ring CCW around its centroid as seen from +viewDir. */
export function orderRingCCW(
  ring: THREE.Vector3[],
  viewDir = new THREE.Vector3(0, 0, 1),
): THREE.Vector3[] {
  if (ring.length < 3) return ring.map((p) => p.clone());
  const c = ringCentroid(ring);
  const axis = viewDir.clone().normalize();
  const tmp =
    Math.abs(axis.y) < 0.9
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);
  const xAxis = new THREE.Vector3().crossVectors(tmp, axis).normalize();
  const yAxis = new THREE.Vector3().crossVectors(axis, xAxis).normalize();

  const scored = ring.map((p, i) => {
    const d = new THREE.Vector3().subVectors(p, c);
    const ang = Math.atan2(d.dot(yAxis), d.dot(xAxis));
    return { p, i, ang };
  });
  scored.sort((a, b) => a.ang - b.ang);
  return scored.map((s) => s.p.clone());
}

export type LoftOpts = {
  minSegments?: number;
  maxSegments?: number;
  bulgeScale?: number;
};

const _e1 = new THREE.Vector3();
const _e2 = new THREE.Vector3();
const _n = new THREE.Vector3();
const _lc = new THREE.Vector3();
const _rc = new THREE.Vector3();
const _spanVec = new THREE.Vector3();
const _spanDir = new THREE.Vector3();
const _center = new THREE.Vector3();
const _base = new THREE.Vector3();
const _radial = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _ridgeAxis = new THREE.Vector3();
const _camAxis = new THREE.Vector3();
const _mid = new THREE.Vector3();
const _approxN = new THREE.Vector3();
const _capC = new THREE.Vector3();

/**
 * Write dynamic loft into preallocated buffers. Returns vertex count.
 * Topology is fixed-capacity; draw with setDrawRange(0, vertexCount).
 */
export function writeDynamicLoft(
  leftIn: THREE.Vector3[],
  rightIn: THREE.Vector3[],
  opts: LoftOpts | undefined,
  positions: Float32Array,
  normals: Float32Array,
  loftUs: Float32Array,
): { vertexCount: number; segments: number } {
  const n = Math.min(leftIn.length, rightIn.length);
  if (n < 2) return { vertexCount: 0, segments: 0 };

  const left = leftIn.slice(0, n);
  const right = rightIn.slice(0, n);

  const minSeg = opts?.minSegments ?? 3;
  const maxSeg = opts?.maxSegments ?? 12;
  const bulgeScale = opts?.bulgeScale ?? 1;

  ringCentroid(left, _lc);
  ringCentroid(right, _rc);
  _spanVec.subVectors(_rc, _lc);
  const span = _spanVec.length();
  if (span > 1e-6) _spanDir.copy(_spanVec).multiplyScalar(1 / span);
  else _spanDir.set(1, 0, 0);

  const segments = Math.round(
    THREE.MathUtils.clamp(minSeg + span * 5.5 * bulgeScale, minSeg, maxSeg),
  );

  const rings: THREE.Vector3[][] = [];
  for (let s = 0; s <= segments; s++) {
    const t = s / segments;
    const te = t * t * (3 - 2 * t);
    _center.lerpVectors(_lc, _rc, te);
    const ring: THREE.Vector3[] = [];
    const bulge = Math.sin(Math.PI * t) * (0.06 + span * 0.08) * bulgeScale;
    _ridgeAxis.crossVectors(_spanDir, _up);
    if (_ridgeAxis.lengthSq() < 1e-8) {
      _ridgeAxis.crossVectors(_spanDir, _n.set(0, 0, 1));
    }
    _ridgeAxis.normalize();
    _camAxis.crossVectors(_spanDir, _ridgeAxis).normalize();

    for (let i = 0; i < n; i++) {
      _base.lerpVectors(left[i], right[i], te);
      _radial.subVectors(_base, _center);
      const rLen = _radial.length();
      if (rLen > 1e-8) {
        _base.addScaledVector(_radial.multiplyScalar(1 / rLen), bulge);
      }
      const ridge = Math.sin((i / n) * Math.PI * 2) * bulge * 0.85;
      _base.addScaledVector(_camAxis, ridge);
      ring.push(_base.clone());
    }
    rings.push(ring);
  }

  let vi = 0;
  for (let s = 0; s < segments; s++) {
    const a = rings[s];
    const b = rings[s + 1];
    const uA = s / segments;
    const uB = (s + 1) / segments;
    const uM = (uA + uB) * 0.5;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const p00 = a[i];
      const p10 = b[i];
      const p11 = b[j];
      const p01 = a[j];
      _mid.set(0, 0, 0).add(p00).add(p10).add(p11).add(p01).multiplyScalar(0.25);
      _approxN.subVectors(p10, p00).cross(_e2.subVectors(p01, p00));
      if (_approxN.lengthSq() > 1e-10) {
        _mid.addScaledVector(
          _approxN.normalize(),
          (span * 0.01 + 0.008) * bulgeScale,
        );
      }
      vi = writeTri(positions, normals, loftUs, vi, p00, p10, _mid, uA, uB, uM, _e1, _e2, _n);
      vi = writeTri(positions, normals, loftUs, vi, p10, p11, _mid, uB, uB, uM, _e1, _e2, _n);
      vi = writeTri(positions, normals, loftUs, vi, p11, p01, _mid, uB, uA, uM, _e1, _e2, _n);
      vi = writeTri(positions, normals, loftUs, vi, p01, p00, _mid, uA, uA, uM, _e1, _e2, _n);
    }
  }

  if (n >= 3) {
    const cap = (ring: THREE.Vector3[], outward: THREE.Vector3, loftU: number) => {
      ringCentroid(ring, _capC);
      _capC.addScaledVector(outward, Math.max(span * 0.04, 0.03) * bulgeScale);
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        vi = writeTri(
          positions,
          normals,
          loftUs,
          vi,
          _capC,
          ring[i],
          ring[j],
          loftU,
          loftU,
          loftU,
          _e1,
          _e2,
          _n,
        );
      }
    };
    cap(rings[0], _e1.copy(_spanDir).negate(), 0);
    cap(rings[rings.length - 1], _spanDir, 1);
  }

  return { vertexCount: vi, segments };
}

/** Flat card into preallocated buffers. */
export function writeFlatQuad(
  corners: THREE.Vector3[],
  positions: Float32Array,
  normals: Float32Array,
  loftUs: Float32Array,
): number {
  if (corners.length < 4) return 0;
  const ordered = orderRingCCW(corners.slice(0, 4));
  const [p0, p1, p2, p3] = ordered;
  const cx = (p0.x + p1.x + p2.x + p3.x) / 4;
  const uOf = (p: THREE.Vector3) =>
    THREE.MathUtils.clamp(0.5 + (p.x - cx) * 0.8, 0, 1);
  let vi = 0;
  vi = writeTri(positions, normals, loftUs, vi, p0, p1, p2, uOf(p0), uOf(p1), uOf(p2), _e1, _e2, _n);
  vi = writeTri(positions, normals, loftUs, vi, p0, p2, p3, uOf(p0), uOf(p2), uOf(p3), _e1, _e2, _n);
  return vi;
}

function pushLine(
  positions: Float32Array,
  pi: number,
  a: THREE.Vector3,
  b: THREE.Vector3,
): number {
  if (pi + 2 > WIRE_MAX_POINTS) return pi;
  let o = pi * 3;
  positions[o] = a.x;
  positions[o + 1] = a.y;
  positions[o + 2] = a.z;
  positions[o + 3] = b.x;
  positions[o + 4] = b.y;
  positions[o + 5] = b.z;
  return pi + 2;
}

/** Procedural wire: end-ring edges + tip longitudes (no EdgesGeometry). */
export function writeLoftWire(
  left: THREE.Vector3[],
  right: THREE.Vector3[],
  positions: Float32Array,
  withInternal: boolean,
): number {
  const n = Math.min(left.length, right.length);
  if (n < 2) return 0;
  let pi = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    pi = pushLine(positions, pi, left[i], left[j]);
    pi = pushLine(positions, pi, right[i], right[j]);
    if (withInternal) pi = pushLine(positions, pi, left[i], right[i]);
  }
  return pi;
}

/** Perimeter only wire from 4 corners. */
export function writePerimeterWire(
  corners: THREE.Vector3[],
  positions: Float32Array,
): number {
  if (corners.length < 4) return 0;
  const ordered = orderRingCCW(corners.slice(0, 4));
  let pi = 0;
  for (let i = 0; i < 4; i++) {
    pi = pushLine(positions, pi, ordered[i], ordered[(i + 1) % 4]);
  }
  return pi;
}

/**
 * Hand cross-section from finger tips — shape follows live spread.
 */
export function handSectionFromLandmarks(
  hand: Landmark[],
  toV: (p: Landmark) => THREE.Vector3,
  tips: number[],
): THREE.Vector3[] {
  const pts = tips
    .map((i) => hand[i])
    .filter(Boolean)
    .map((p) => toV(p!));

  if (pts.length >= 3) {
    return orderRingCCW(pts);
  }

  if (pts.length === 2) {
    const [a, b] = pts;
    const along = new THREE.Vector3().subVectors(b, a);
    const len = along.length() || 1e-4;
    along.multiplyScalar(1 / len);
    let side = new THREE.Vector3().crossVectors(along, new THREE.Vector3(0, 0, 1));
    if (side.lengthSq() < 1e-8) {
      side = new THREE.Vector3().crossVectors(along, new THREE.Vector3(0, 1, 0));
    }
    side.normalize().multiplyScalar(len * 0.22);
    return orderRingCCW([
      a.clone().add(side),
      b.clone().add(side),
      b.clone().sub(side),
      a.clone().sub(side),
    ]);
  }

  return pts;
}

export function angleDeg(v1: THREE.Vector3, v2: THREE.Vector3): number {
  const d = v1.dot(v2);
  const m = v1.length() * v2.length() || 1e-8;
  const c = Math.min(1, Math.max(-1, d / m));
  return (Math.acos(c) * 180) / Math.PI;
}

export function interiorAngleAt(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  inset = 0.12,
): { deg: number; labelPos: THREE.Vector3 } {
  const v1 = new THREE.Vector3().subVectors(a, b);
  const v2 = new THREE.Vector3().subVectors(c, b);
  const deg = angleDeg(v1, v2);
  const u1 = v1.clone().normalize();
  const u2 = v2.clone().normalize();
  let bis = u1.add(u2);
  if (bis.lengthSq() < 1e-8) {
    bis = new THREE.Vector3().crossVectors(v1, new THREE.Vector3(0, 0, 1));
  }
  bis.normalize();
  const labelPos = b
    .clone()
    .add(bis.multiplyScalar(inset * Math.min(v1.length(), v2.length())));
  return { deg, labelPos };
}
