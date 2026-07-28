import * as THREE from 'three';
import { OneEuroFilter } from '1eurofilter';
import { hybridShader, holoShader, normalRgbShader } from './shaders';
import {
  handSectionFromLandmarks,
  interiorAngleAt,
  landmarkToScene,
  LOFT_MAX_VERTS,
  WIRE_MAX_POINTS,
  writeDynamicLoft,
  writeFlatQuad,
  writeLoftWire,
  writePerimeterWire,
} from './geometry';
import { deriveMaterialParams } from './flatness';
import type { Landmark } from './landmarks';
import { TIP } from './landmarks';

export type ShadeMode = 'hybrid' | 'holo' | 'normal';

export type AngleLabel = {
  deg: number;
  x: number;
  y: number;
};

export type UpdateResult = {
  angles: AngleLabel[];
  span: number;
  flatness: number;
};

const SECTION_TIPS = [TIP.thumb, TIP.index, TIP.middle, TIP.ring];
const HOLD_MS = 400;

/** One-Euro on a Vector3 (official Casiez filter — not fixed EMA). */
class Vec3Euro {
  private fx: OneEuroFilter;
  private fy: OneEuroFilter;
  private fz: OneEuroFilter;
  private out = new THREE.Vector3();

  constructor(freq = 60, mincutoff = 1.0, beta = 0.007) {
    this.fx = new OneEuroFilter(freq, mincutoff, beta, 1.0);
    this.fy = new OneEuroFilter(freq, mincutoff, beta, 1.0);
    this.fz = new OneEuroFilter(freq, mincutoff, beta, 1.0);
  }

  filter(v: THREE.Vector3, tSec: number): THREE.Vector3 {
    return this.out.set(
      this.fx.filter(v.x, tSec),
      this.fy.filter(v.y, tSec),
      this.fz.filter(v.z, tSec),
    );
  }
}

export class PrismScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private mesh: THREE.Mesh;
  private wire: THREE.LineSegments;
  private matHybrid: THREE.ShaderMaterial;
  private matNormal: THREE.ShaderMaterial;
  private matHolo: THREE.ShaderMaterial;
  private matWire: THREE.LineBasicMaterial;
  private shadeMode: ShadeMode = 'hybrid';
  private showWire = true;
  private clock = new THREE.Clock();
  private meshOpacityMul = 1;
  private baseOpacity = 0.88;
  private lastInputLeft: Landmark[] | null = null;
  private lastInputRight: Landmark[] | null = null;
  private lastMirrorX = false;
  private lastResult: UpdateResult = { angles: [], span: 0, flatness: 0 };
  private lastTopo = { internalWires: true, usePerimeterOnly: false };
  private hasMesh = false;

  private posArr = new Float32Array(LOFT_MAX_VERTS * 3);
  private normArr = new Float32Array(LOFT_MAX_VERTS * 3);
  private loftArr = new Float32Array(LOFT_MAX_VERTS);
  private posAttr: THREE.BufferAttribute;
  private normAttr: THREE.BufferAttribute;
  private loftAttr: THREE.BufferAttribute;
  private meshGeo: THREE.BufferGeometry;

  private wireArr = new Float32Array(WIRE_MAX_POINTS * 3);
  private wireAttr: THREE.BufferAttribute;
  private wireGeo: THREE.BufferGeometry;

  private smoothLeft: THREE.Vector3[] | null = null;
  private smoothRight: THREE.Vector3[] | null = null;
  private smoothCorners: THREE.Vector3[] | null = null;
  private leftFilters: Vec3Euro[] = [];
  private rightFilters: Vec3Euro[] = [];
  private cornerFilters: Vec3Euro[] = [];

  private lastGoodLeft: Landmark[] | null = null;
  private lastGoodRight: Landmark[] | null = null;
  private lastGoodAt = 0;
  private holding = false;

  private scratchLm = new THREE.Vector3();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
    this.camera.position.set(0, 0, 4.2);

    const sharedUniforms = () => ({
      uOpacity: { value: 0.88 },
      uTime: { value: 0 },
      uCameraPos: { value: this.camera.position.clone() },
      uFilmMix: { value: 0.7 },
      uFlatness: { value: 0.5 },
    });

    this.matHybrid = new THREE.ShaderMaterial({
      vertexShader: hybridShader.vertexShader,
      fragmentShader: hybridShader.fragmentShader,
      uniforms: sharedUniforms(),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.matNormal = new THREE.ShaderMaterial({
      vertexShader: normalRgbShader.vertexShader,
      fragmentShader: normalRgbShader.fragmentShader,
      uniforms: { uOpacity: { value: 0.88 } },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.matHolo = new THREE.ShaderMaterial({
      vertexShader: holoShader.vertexShader,
      fragmentShader: holoShader.fragmentShader,
      uniforms: {
        uOpacity: { value: 0.86 },
        uTime: { value: 0 },
        uCameraPos: { value: this.camera.position.clone() },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.matWire = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
    });

    // Preallocated dynamic mesh (three.js How-to-update-things pattern).
    this.meshGeo = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.posArr, 3);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    this.normAttr = new THREE.BufferAttribute(this.normArr, 3);
    this.normAttr.setUsage(THREE.DynamicDrawUsage);
    this.loftAttr = new THREE.BufferAttribute(this.loftArr, 1);
    this.loftAttr.setUsage(THREE.DynamicDrawUsage);
    this.meshGeo.setAttribute('position', this.posAttr);
    this.meshGeo.setAttribute('normal', this.normAttr);
    this.meshGeo.setAttribute('loftU', this.loftAttr);
    this.meshGeo.setDrawRange(0, 0);
    this.mesh = new THREE.Mesh(this.meshGeo, this.matHybrid);
    this.mesh.visible = false;
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);

    this.wireGeo = new THREE.BufferGeometry();
    this.wireAttr = new THREE.BufferAttribute(this.wireArr, 3);
    this.wireAttr.setUsage(THREE.DynamicDrawUsage);
    this.wireGeo.setAttribute('position', this.wireAttr);
    this.wireGeo.setDrawRange(0, 0);
    this.wire = new THREE.LineSegments(this.wireGeo, this.matWire);
    this.wire.visible = false;
    this.wire.frustumCulled = false;
    this.scene.add(this.wire);

    this.resize();
  }

  setShadeMode(mode: ShadeMode): void {
    this.shadeMode = mode;
    this.mesh.material = this.activeMat();
  }

  setShowWire(on: boolean): void {
    this.showWire = on;
    this.wire.visible = on && this.hasMesh;
  }

  /** Soft fade multiplier 0..1 (lost-hand hold). */
  setFade(mul: number): void {
    this.meshOpacityMul = THREE.MathUtils.clamp(mul, 0, 1);
    this.applyOpacity();
  }

  get isHolding(): boolean {
    return this.holding;
  }

  resize(): void {
    const canvas = this.renderer.domElement;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private hideMesh(): void {
    this.hasMesh = false;
    this.mesh.visible = false;
    this.wire.visible = false;
    this.meshGeo.setDrawRange(0, 0);
    this.wireGeo.setDrawRange(0, 0);
    this.lastInputLeft = null;
    this.lastInputRight = null;
  }

  private applyOpacity(): void {
    const opacity = this.baseOpacity * this.meshOpacityMul;
    for (const mat of [this.matHybrid, this.matNormal, this.matHolo]) {
      if (mat.uniforms.uOpacity) mat.uniforms.uOpacity.value = opacity;
    }
    this.matWire.opacity = 0.95 * this.meshOpacityMul;
  }

  private activeMat(): THREE.ShaderMaterial {
    if (this.shadeMode === 'normal') return this.matNormal;
    if (this.shadeMode === 'holo') return this.matHolo;
    return this.matHybrid;
  }

  private ensureFilters(n: number, bucket: Vec3Euro[]): void {
    while (bucket.length < n) bucket.push(new Vec3Euro(60, 1.0, 0.007));
  }

  private smoothRing(
    prev: THREE.Vector3[] | null,
    next: THREE.Vector3[],
    filters: Vec3Euro[],
    tSec: number,
  ): THREE.Vector3[] {
    this.ensureFilters(next.length, filters);
    if (!prev || prev.length !== next.length) {
      // Seed filters without storing clones of raw targets as "prev identity"
      return next.map((p, i) => filters[i].filter(p, tSec).clone());
    }
    return next.map((p, i) => filters[i].filter(p, tSec).clone());
  }

  /**
   * Resolve hands with ~400ms hold on lost tracking, then fade out.
   */
  resolveHands(
    left: Landmark[] | null,
    right: Landmark[] | null,
    now = performance.now(),
  ): {
    left: Landmark[] | null;
    right: Landmark[] | null;
    held: boolean;
    fading: boolean;
  } {
    if (left && right) {
      this.lastGoodLeft = left;
      this.lastGoodRight = right;
      this.lastGoodAt = now;
      this.holding = false;
      this.setFade(1);
      return { left, right, held: false, fading: false };
    }

    const age = now - this.lastGoodAt;
    if (this.lastGoodLeft && this.lastGoodRight && age < HOLD_MS) {
      this.holding = true;
      this.setFade(1);
      return {
        left: this.lastGoodLeft,
        right: this.lastGoodRight,
        held: true,
        fading: false,
      };
    }

    if (this.lastGoodLeft && this.lastGoodRight && age < HOLD_MS + 280) {
      this.holding = true;
      const t = (age - HOLD_MS) / 280;
      this.setFade(1 - t);
      return {
        left: this.lastGoodLeft,
        right: this.lastGoodRight,
        held: true,
        fading: true,
      };
    }

    this.holding = false;
    this.lastGoodLeft = null;
    this.lastGoodRight = null;
    this.setFade(1);
    return { left: null, right: null, held: false, fading: false };
  }

  updateFromHands(
    left: Landmark[] | null,
    right: Landmark[] | null,
    mirrorX: boolean,
  ): UpdateResult {
    const canvas = this.renderer.domElement;
    const aspect = (canvas.clientWidth || 1) / (canvas.clientHeight || 1);
    const toV = (p: Landmark) => landmarkToScene(p, aspect, mirrorX, this.scratchLm).clone();

    if (!left || !right || left.length < 2 || right.length < 2) {
      this.hideMesh();
      this.smoothLeft = null;
      this.smoothRight = null;
      this.smoothCorners = null;
      return { angles: [], span: 0, flatness: 0 };
    }

    const sameInput =
      left === this.lastInputLeft &&
      right === this.lastInputRight &&
      mirrorX === this.lastMirrorX &&
      this.hasMesh &&
      !!this.smoothCorners;
    if (sameInput) {
      return {
        ...this.lastResult,
        angles: this.projectAngles(this.smoothCorners!),
      };
    }

    const tSec = performance.now() / 1000;
    const targetL = handSectionFromLandmarks(left, toV, SECTION_TIPS);
    const targetR = handSectionFromLandmarks(right, toV, SECTION_TIPS);
    const alignedR = alignRingWinding(targetL, targetR);

    this.smoothLeft = this.smoothRing(this.smoothLeft, targetL, this.leftFilters, tSec);
    this.smoothRight = this.smoothRing(this.smoothRight, alignedR, this.rightFilters, tSec);

    const lThumb = toV(left[TIP.thumb] ?? left[0]);
    const lIndex = toV(left[TIP.index] ?? left[1]);
    const rThumb = toV(right[TIP.thumb] ?? right[0]);
    const rIndex = toV(right[TIP.index] ?? right[1]);
    const rawCorners = [lThumb, lIndex, rIndex, rThumb];
    this.smoothCorners = this.smoothRing(
      this.smoothCorners,
      rawCorners,
      this.cornerFilters,
      tSec,
    );

    const span = ringSpan(this.smoothLeft, this.smoothRight);
    const params = deriveMaterialParams({
      corners: this.smoothCorners,
      leftRing: this.smoothLeft,
      rightRing: this.smoothRight,
      span,
      prev: this.lastTopo,
    });
    this.lastTopo = {
      internalWires: params.internalWires,
      usePerimeterOnly: params.usePerimeterOnly,
    };

    let vertexCount = 0;
    if (params.usePerimeterOnly) {
      vertexCount = writeFlatQuad(
        this.smoothCorners,
        this.posArr,
        this.normArr,
        this.loftArr,
      );
    } else {
      vertexCount = writeDynamicLoft(
        this.smoothLeft,
        this.smoothRight,
        {
          minSegments: params.minSegments,
          maxSegments: params.maxSegments,
          bulgeScale: params.bulgeScale,
        },
        this.posArr,
        this.normArr,
        this.loftArr,
      ).vertexCount;
    }

    this.posAttr.needsUpdate = true;
    this.normAttr.needsUpdate = true;
    this.loftAttr.needsUpdate = true;
    this.meshGeo.setDrawRange(0, vertexCount);
    this.meshGeo.computeBoundingSphere();

    const mat = this.activeMat();
    this.mesh.material = mat;
    if (mat.uniforms.uFilmMix) mat.uniforms.uFilmMix.value = params.filmMix;
    if (mat.uniforms.uFlatness) mat.uniforms.uFlatness.value = params.flatness;
    this.baseOpacity = params.opacity;
    this.applyOpacity();

    let wirePoints = 0;
    if (params.usePerimeterOnly || !params.internalWires) {
      wirePoints = writePerimeterWire(this.smoothCorners, this.wireArr);
    } else {
      wirePoints = writeLoftWire(
        this.smoothLeft,
        this.smoothRight,
        this.wireArr,
        true,
      );
    }
    this.wireAttr.needsUpdate = true;
    this.wireGeo.setDrawRange(0, wirePoints);
    this.wire.visible = this.showWire && vertexCount > 0;

    this.hasMesh = vertexCount > 0;
    this.mesh.visible = this.hasMesh;

    this.lastInputLeft = left;
    this.lastInputRight = right;
    this.lastMirrorX = mirrorX;
    this.lastResult = {
      angles: this.projectAngles(this.smoothCorners),
      span,
      flatness: params.flatness,
    };
    return this.lastResult;
  }

  private projectAngles(corners: THREE.Vector3[]): AngleLabel[] {
    const canvas = this.renderer.domElement;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const angleDefs = [
      interiorAngleAt(corners[3], corners[0], corners[1]),
      interiorAngleAt(corners[0], corners[1], corners[2]),
      interiorAngleAt(corners[1], corners[2], corners[3]),
      interiorAngleAt(corners[2], corners[3], corners[0]),
    ];

    return angleDefs.map((a) => {
      const ndc = a.labelPos.clone().project(this.camera);
      return {
        deg: a.deg,
        x: (ndc.x * 0.5 + 0.5) * w,
        y: (-ndc.y * 0.5 + 0.5) * h,
      };
    });
  }

  render(): void {
    const t = this.clock.getElapsedTime();
    for (const mat of [this.matHybrid, this.matHolo]) {
      if (mat.uniforms.uTime) mat.uniforms.uTime.value = t;
      if (mat.uniforms.uCameraPos)
        mat.uniforms.uCameraPos.value.copy(this.camera.position);
    }
    this.renderer.render(this.scene, this.camera);
  }
}

function ringSpan(a: THREE.Vector3[], b: THREE.Vector3[]): number {
  const ca = new THREE.Vector3();
  const cb = new THREE.Vector3();
  for (const p of a) ca.add(p);
  for (const p of b) cb.add(p);
  ca.multiplyScalar(1 / a.length);
  cb.multiplyScalar(1 / b.length);
  return ca.distanceTo(cb);
}

function alignRingWinding(
  left: THREE.Vector3[],
  right: THREE.Vector3[],
): THREE.Vector3[] {
  const n = Math.min(left.length, right.length);
  if (n < 3) return right;

  let bestShift = 0;
  let bestScore = Infinity;
  let bestRev = false;

  const candidates = [right.slice(0, n), [...right.slice(0, n)].reverse()];

  for (let rev = 0; rev < 2; rev++) {
    const ring = candidates[rev];
    for (let shift = 0; shift < n; shift++) {
      let score = 0;
      for (let i = 0; i < n; i++) {
        score += left[i].distanceToSquared(ring[(i + shift) % n]);
      }
      if (score < bestScore) {
        bestScore = score;
        bestShift = shift;
        bestRev = rev === 1;
      }
    }
  }

  const base = bestRev
    ? [...right.slice(0, n)].reverse()
    : right.slice(0, n);
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) out.push(base[(i + bestShift) % n]);
  return out;
}
