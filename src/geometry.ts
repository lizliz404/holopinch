import * as THREE from 'three';

export type Landmark = { x: number; y: number; z: number };

/** Map normalized landmark → Three scene coords. */
export function landmarkToScene(
  p: Landmark,
  aspect: number,
  mirrorX: boolean,
): THREE.Vector3 {
  const xN = mirrorX ? 1 - p.x : p.x;
  const x = (xN - 0.5) * 2 * aspect;
  const y = -(p.y - 0.5) * 2;
  const z = -p.z * 2.5;
  return new THREE.Vector3(x, y, z);
}

function pushTri(
  positions: number[],
  normals: number[],
  loftUs: number[],
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  u0: number,
  u1: number,
  u2: number,
): void {
  const e1 = new THREE.Vector3().subVectors(p1, p0);
  const e2 = new THREE.Vector3().subVectors(p2, p0);
  const nn = new THREE.Vector3().crossVectors(e1, e2);
  if (nn.lengthSq() < 1e-12) return;
  nn.normalize();
  positions.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
  for (let k = 0; k < 3; k++) normals.push(nn.x, nn.y, nn.z);
  loftUs.push(u0, u1, u2);
}

function ringCentroid(ring: THREE.Vector3[]): THREE.Vector3 {
  const c = new THREE.Vector3();
  for (const p of ring) c.add(p);
  return c.multiplyScalar(1 / Math.max(ring.length, 1));
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

/**
 * Dynamic loft solid between two hand sections.
 * Continuous growth: span + bulgeScale drive segment count + mid bulge + ridge.
 */
export function buildDynamicLoft(
  leftIn: THREE.Vector3[],
  rightIn: THREE.Vector3[],
  opts?: LoftOpts,
): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const n = Math.min(leftIn.length, rightIn.length);
  if (n < 2) return geo;

  const left = leftIn.slice(0, n);
  const right = rightIn.slice(0, n);

  const minSeg = opts?.minSegments ?? 3;
  const maxSeg = opts?.maxSegments ?? 12;
  const bulgeScale = opts?.bulgeScale ?? 1;

  const lc = ringCentroid(left);
  const rc = ringCentroid(right);
  const spanVec = new THREE.Vector3().subVectors(rc, lc);
  const span = spanVec.length();
  const spanDir =
    span > 1e-6 ? spanVec.clone().normalize() : new THREE.Vector3(1, 0, 0);

  const segments = Math.round(
    THREE.MathUtils.clamp(minSeg + span * 5.5 * bulgeScale, minSeg, maxSeg),
  );

  const positions: number[] = [];
  const normals: number[] = [];
  const loftUs: number[] = [];

  const rings: THREE.Vector3[][] = [];
  for (let s = 0; s <= segments; s++) {
    const t = s / segments;
    const te = t * t * (3 - 2 * t);
    const center = new THREE.Vector3().lerpVectors(lc, rc, te);
    const ring: THREE.Vector3[] = [];
    const bulge = Math.sin(Math.PI * t) * (0.06 + span * 0.08) * bulgeScale;
    const up = new THREE.Vector3(0, 1, 0);
    let ridgeAxis = new THREE.Vector3().crossVectors(spanDir, up);
    if (ridgeAxis.lengthSq() < 1e-8) {
      ridgeAxis = new THREE.Vector3().crossVectors(
        spanDir,
        new THREE.Vector3(0, 0, 1),
      );
    }
    ridgeAxis.normalize();
    const camAxis = new THREE.Vector3()
      .crossVectors(spanDir, ridgeAxis)
      .normalize();

    for (let i = 0; i < n; i++) {
      const base = new THREE.Vector3().lerpVectors(left[i], right[i], te);
      const radial = new THREE.Vector3().subVectors(base, center);
      const rLen = radial.length();
      if (rLen > 1e-8) {
        base.addScaledVector(radial.multiplyScalar(1 / rLen), bulge);
      }
      const ridge = Math.sin((i / n) * Math.PI * 2) * bulge * 0.85;
      base.addScaledVector(camAxis, ridge);
      ring.push(base);
    }
    rings.push(ring);
  }

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
      const mid = new THREE.Vector3()
        .add(p00)
        .add(p10)
        .add(p11)
        .add(p01)
        .multiplyScalar(0.25);
      const approxN = new THREE.Vector3()
        .subVectors(p10, p00)
        .cross(new THREE.Vector3().subVectors(p01, p00));
      if (approxN.lengthSq() > 1e-10) {
        mid.addScaledVector(
          approxN.normalize(),
          (span * 0.01 + 0.008) * bulgeScale,
        );
      }
      pushTri(positions, normals, loftUs, p00, p10, mid, uA, uB, uM);
      pushTri(positions, normals, loftUs, p10, p11, mid, uB, uB, uM);
      pushTri(positions, normals, loftUs, p11, p01, mid, uB, uA, uM);
      pushTri(positions, normals, loftUs, p01, p00, mid, uA, uA, uM);
    }
  }

  if (n >= 3) {
    const cap = (
      ring: THREE.Vector3[],
      outward: THREE.Vector3,
      loftU: number,
    ) => {
      const c = ringCentroid(ring);
      c.addScaledVector(outward, Math.max(span * 0.04, 0.03) * bulgeScale);
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        pushTri(
          positions,
          normals,
          loftUs,
          c,
          ring[i],
          ring[j],
          loftU,
          loftU,
          loftU,
        );
      }
    };
    cap(rings[0], spanDir.clone().negate(), 0);
    cap(rings[rings.length - 1], spanDir, 1);
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('loftU', new THREE.Float32BufferAttribute(loftUs, 1));
  return geo;
}

/** Flat card: two tris from 4 ordered pinch corners + loftU across span. */
export function buildFlatQuad(corners: THREE.Vector3[]): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  if (corners.length < 4) return geo;

  // Expect [L-thumb, L-index, R-index, R-thumb] — order CCW for stable winding
  const ordered = orderRingCCW(corners.slice(0, 4));
  const [p0, p1, p2, p3] = ordered;
  const positions: number[] = [];
  const normals: number[] = [];
  const loftUs: number[] = [];

  // loftU: left side ~0, right ~1 based on x of centroid
  const cx = (p0.x + p1.x + p2.x + p3.x) / 4;
  const uOf = (p: THREE.Vector3) =>
    THREE.MathUtils.clamp(0.5 + (p.x - cx) * 0.8, 0, 1);

  pushTri(
    positions,
    normals,
    loftUs,
    p0,
    p1,
    p2,
    uOf(p0),
    uOf(p1),
    uOf(p2),
  );
  pushTri(
    positions,
    normals,
    loftUs,
    p0,
    p2,
    p3,
    uOf(p0),
    uOf(p2),
    uOf(p3),
  );

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('loftU', new THREE.Float32BufferAttribute(loftUs, 1));
  return geo;
}

/** Perimeter LineLoop positions from ordered corners. */
export function buildPerimeterLoop(
  corners: THREE.Vector3[],
): THREE.BufferGeometry {
  const ordered = orderRingCCW(corners.slice(0, 4));
  const pts: number[] = [];
  for (const p of ordered) pts.push(p.x, p.y, p.z);
  if (ordered.length) {
    pts.push(ordered[0].x, ordered[0].y, ordered[0].z);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return geo;
}

/**
 * Hand cross-section from finger tips — shape follows live spread.
 * Ordered CCW so loft doesn't bow-tie.
 * When tips are nearly coplanar/thin, prefer strict 4 tips (thumb+index+middle+ring).
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
