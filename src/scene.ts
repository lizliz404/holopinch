import * as THREE from 'three';
import { hybridShader, holoShader, normalRgbShader } from './shaders';
import {
  buildDynamicLoft,
  buildFlatQuad,
  buildPerimeterLoop,
  handSectionFromLandmarks,
  interiorAngleAt,
  landmarkToScene,
} from './geometry';
import { deriveMaterialParams } from './flatness';
import type { Landmark } from './hands';
import { TIP } from './hands';

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

export class PrismScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private mesh: THREE.Mesh | null = null;
  private wire: THREE.Line | THREE.LineSegments | null = null;
  private matHybrid: THREE.ShaderMaterial;
  private matNormal: THREE.ShaderMaterial;
  private matHolo: THREE.ShaderMaterial;
  private matWire: THREE.LineBasicMaterial;
  private shadeMode: ShadeMode = 'hybrid';
  private showWire = true;
  private clock = new THREE.Clock();
  private meshOpacityMul = 1;

  private smoothLeft: THREE.Vector3[] | null = null;
  private smoothRight: THREE.Vector3[] | null = null;
  private smoothCorners: THREE.Vector3[] | null = null;
  private smoothAlpha = 0.38;

  private lastGoodLeft: Landmark[] | null = null;
  private lastGoodRight: Landmark[] | null = null;
  private lastGoodAt = 0;
  private holding = false;

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

    this.resize();
  }

  setShadeMode(mode: ShadeMode): void {
    this.shadeMode = mode;
    if (this.mesh) this.mesh.material = this.activeMat();
  }

  setShowWire(on: boolean): void {
    this.showWire = on;
    if (this.wire) this.wire.visible = on;
  }

  setSmoothAlpha(a: number): void {
    this.smoothAlpha = THREE.MathUtils.clamp(a, 0.05, 1);
  }

  /** Soft fade multiplier 0..1 (lost-hand hold). */
  setFade(mul: number): void {
    this.meshOpacityMul = THREE.MathUtils.clamp(mul, 0, 1);
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

  private clearMesh(): void {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    if (this.wire) {
      this.scene.remove(this.wire);
      this.wire.geometry.dispose();
      this.wire = null;
    }
  }

  private activeMat(): THREE.ShaderMaterial {
    if (this.shadeMode === 'normal') return this.matNormal;
    if (this.shadeMode === 'holo') return this.matHolo;
    return this.matHybrid;
  }

  private smoothRing(
    prev: THREE.Vector3[] | null,
    next: THREE.Vector3[],
  ): THREE.Vector3[] {
    if (!prev || prev.length !== next.length) {
      return next.map((p) => p.clone());
    }
    return next.map((p, i) => prev[i].clone().lerp(p, this.smoothAlpha));
  }

  /**
   * Resolve hands with ~400ms hold on lost tracking, then fade out.
   * Returns effective landmarks + whether we're in hold/fade.
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
    const toV = (p: Landmark) => landmarkToScene(p, aspect, mirrorX);

    if (!left || !right || left.length < 2 || right.length < 2) {
      this.clearMesh();
      this.smoothLeft = null;
      this.smoothRight = null;
      this.smoothCorners = null;
      return { angles: [], span: 0, flatness: 0 };
    }

    const targetL = handSectionFromLandmarks(left, toV, SECTION_TIPS);
    const targetR = handSectionFromLandmarks(right, toV, SECTION_TIPS);
    const alignedR = alignRingWinding(targetL, targetR);

    this.smoothLeft = this.smoothRing(this.smoothLeft, targetL);
    this.smoothRight = this.smoothRing(this.smoothRight, alignedR);

    const lThumb = toV(left[TIP.thumb] ?? left[0]);
    const lIndex = toV(left[TIP.index] ?? left[1]);
    const rThumb = toV(right[TIP.thumb] ?? right[0]);
    const rIndex = toV(right[TIP.index] ?? right[1]);
    const rawCorners = [lThumb, lIndex, rIndex, rThumb];
    this.smoothCorners = this.smoothRing(this.smoothCorners, rawCorners);

    const span = ringSpan(this.smoothLeft, this.smoothRight);
    const params = deriveMaterialParams({
      corners: this.smoothCorners,
      leftRing: this.smoothLeft,
      rightRing: this.smoothRight,
      span,
    });

    const opacity = params.opacity * this.meshOpacityMul;

    let geo: THREE.BufferGeometry;
    if (params.usePerimeterOnly) {
      geo = buildFlatQuad(this.smoothCorners);
    } else {
      geo = buildDynamicLoft(this.smoothLeft, this.smoothRight, {
        minSegments: params.minSegments,
        maxSegments: params.maxSegments,
        bulgeScale: params.bulgeScale,
      });
    }

    this.clearMesh();
    const mat = this.activeMat();
    if (mat.uniforms.uOpacity) mat.uniforms.uOpacity.value = opacity;
    if (mat.uniforms.uFilmMix) mat.uniforms.uFilmMix.value = params.filmMix;
    if (mat.uniforms.uFlatness) mat.uniforms.uFlatness.value = params.flatness;

    this.mesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.mesh);

    this.matWire.opacity = 0.95 * this.meshOpacityMul;

    if (params.usePerimeterOnly || !params.internalWires) {
      const loopGeo = buildPerimeterLoop(this.smoothCorners);
      this.wire = new THREE.Line(loopGeo, this.matWire);
    } else {
      const edges = new THREE.EdgesGeometry(geo, params.edgeThreshold);
      this.wire = new THREE.LineSegments(edges, this.matWire);
    }
    this.wire.visible = this.showWire;
    this.scene.add(this.wire);

    const corners = this.smoothCorners;
    const angleDefs = [
      interiorAngleAt(corners[3], corners[0], corners[1]),
      interiorAngleAt(corners[0], corners[1], corners[2]),
      interiorAngleAt(corners[1], corners[2], corners[3]),
      interiorAngleAt(corners[2], corners[3], corners[0]),
    ];

    const angles: AngleLabel[] = angleDefs.map((a) => {
      const ndc = a.labelPos.clone().project(this.camera);
      return {
        deg: a.deg,
        x: (ndc.x * 0.5 + 0.5) * canvas.clientWidth,
        y: (-ndc.y * 0.5 + 0.5) * canvas.clientHeight,
      };
    });

    return { angles, span, flatness: params.flatness };
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
