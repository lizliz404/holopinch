import './style.css';
import { resolveAnchors, type AnchorPair } from './anchors';
import { DemoHands } from './demo';
import { HandTracker } from './hands';
import { PrismScene, type ShadeMode } from './scene';

const app = document.querySelector<HTMLDivElement>('#app')!;
const video = document.querySelector<HTMLVideoElement>('#video')!;
const canvas = document.querySelector<HTMLCanvasElement>('#overlay')!;
const topbar = document.querySelector<HTMLElement>('#topbar')!;
const statusEl = document.querySelector<HTMLElement>('#status')!;
const anglesReadout = document.querySelector<HTMLDivElement>('#angles-readout')!;
const labelsRoot = document.querySelector<HTMLDivElement>('#angle-labels')!;
const btnCam = document.querySelector<HTMLButtonElement>('#btn-cam')!;
const btnCamQuick = document.querySelector<HTMLButtonElement>('#btn-cam-quick')!;
const btnCamCompact = document.querySelector<HTMLButtonElement>('#btn-cam-compact')!;
const btnDemo = document.querySelector<HTMLButtonElement>('#btn-demo')!;
const chipAngles = document.querySelector<HTMLButtonElement>('#chip-angles')!;
const chipEdges = document.querySelector<HTMLButtonElement>('#chip-edges')!;
const chipGuess = document.querySelector<HTMLButtonElement>('#chip-guess')!;
const chipShade = document.querySelector<HTMLButtonElement>('#chip-shade')!;
const guessPanel = document.querySelector<HTMLDivElement>('#guess-panel')!;
const guessInput = document.querySelector<HTMLInputElement>('#guess-input')!;
const btnReveal = document.querySelector<HTMLButtonElement>('#btn-reveal')!;
const guessResult = document.querySelector<HTMLDivElement>('#guess-result')!;
const hud = document.querySelector<HTMLElement>('#hud')!;
const hudPanel = document.querySelector<HTMLElement>('#hud-panel')!;
const hudToggle = document.querySelector<HTMLButtonElement>('#hud-toggle')!;
const hudScrim = document.querySelector<HTMLDivElement>('#hud-scrim')!;
const btnAbout = document.querySelector<HTMLButtonElement>('#btn-about')!;
const aboutPanel = document.querySelector<HTMLElement>('#about-panel')!;
const aboutClose = document.querySelector<HTMLButtonElement>('#about-close')!;
const aboutBackdrop = document.querySelector<HTMLDivElement>('#about-backdrop')!;

const params = new URLSearchParams(location.search);
const debugTelemetry = params.get('debug') === '1';
/** Auto-play card→bar continuum for social motion capture (no camera). */
const motionCapture = params.get('motion') === '1';
/** Hide chrome for cleaner recordings. */
const cleanCapture = params.get('clean') === '1' || motionCapture;
const skipAutoCamera = motionCapture || params.get('clean') === '1';
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Island stays collapsed by default everywhere — expand is opt-in (Dynamic Island scale). */
const defaultHudExpanded = false;
const DEMO_STATUS_FULL = isCoarsePointer
  ? 'Demo — drag orbs · two-finger vertical = open · horizontal = spread'
  : 'Demo — drag orbs · scroll = open · Shift+scroll = spread';
const DEMO_STATUS_SHORT = 'Demo';
const START_STATUS_FULL = 'Start camera — or drag the light';
const START_STATUS_SHORT = 'Start camera';
/** Keep in emitted JS so Cloudflare custom-domain asset URLs rotate after cache poison. */
const BUILD_ID = 'worker-pool-2026-07-28c';
if (typeof document !== 'undefined') {
  document.documentElement.dataset.build = BUILD_ID;
}

const demo = new DemoHands(app);

if (cleanCapture) {
  document.documentElement.classList.add('capture-clean');
  hud.classList.add('capture-hidden');
  hudScrim.classList.add('capture-hidden');
}

function showWebGlFallback(): void {
  const msg = document.createElement('div');
  msg.id = 'webgl-fallback';
  msg.innerHTML =
    '<p><strong>WebGL is unavailable</strong> in this browser — HoloPinch needs it to render the hologram. Try a current Chrome/Safari.</p>';
  app.appendChild(msg);
  canvas.style.display = 'none';
  hud.style.display = 'none';
  hudScrim.style.display = 'none';
  demo.setEnabled(false);
}

let scene: PrismScene | null = null;
try {
  scene = new PrismScene(canvas);
} catch (err) {
  console.error(err);
  showWebGlFallback();
}

if (scene) {
  startApp(scene);
}

function startApp(scene: PrismScene): void {

let tracker: HandTracker | null = null;

type InputMode = 'demo' | 'camera';
type BrandState = 'intro' | 'loading' | 'idle' | 'active';
const SHADE_CYCLE: ShadeMode[] = ['hybrid', 'holo', 'normal'];
const SHADE_LABEL: Record<ShadeMode, string> = {
  hybrid: 'Shade · hybrid',
  holo: 'Shade · holo',
  normal: 'Shade · normal',
};

let inputMode: InputMode = 'demo';
let lastAngles: number[] = [];
let revealed = false;
let cameraStarting = false;
let showAngles = false;
let shadeMode: ShadeMode = 'hybrid';

let camLeft: AnchorPair['left'] | null = null;
let camRight: AnchorPair['right'] | null = null;
let lastHandsSeen: 0 | 1 | 2 = 0;
let lastTipCount = 0;

let shareHintShown = false;
let shareHintUntil = 0;
let aboutOpen = false;
let hudExpanded = defaultHudExpanded;
let brandState: BrandState = 'loading';
let introStage = !motionCapture;
let introAttracting = !motionCapture && !prefersReducedMotion;
/** Full status for expanded island; short label for collapsed pill. */
let statusFull = 'Loading…';
let statusShort = 'Loading…';

function setBrandState(next: BrandState): void {
  if (brandState === next) return;
  brandState = next;
  topbar.dataset.brand = next;
}

function paintStatus(): void {
  statusEl.textContent = hudExpanded ? statusFull : statusShort;
  statusEl.title = statusFull;
}

function setStatus(full: string, short?: string): void {
  statusFull = full;
  statusShort = short ?? shortenStatus(full);
  paintStatus();
}

function shortenStatus(full: string): string {
  const map: [RegExp, string][] = [
    [/loading hand model/i, 'Loading…'],
    [/requesting camera/i, 'Camera…'],
    [/show your hand/i, 'Show hand'],
    [/spread fingers/i, 'Spread…'],
    [/tracking/i, 'Tracking'],
    [/screenshot/i, 'Snap it'],
    [/hands lost.*fading/i, 'Fading…'],
    [/hands lost.*holding/i, 'Holding…'],
    [/camera blocked/i, 'Blocked'],
    [/camera failed/i, 'Cam fail'],
    [/^demo/i, DEMO_STATUS_SHORT],
  ];
  for (const [re, label] of map) {
    if (re.test(full)) return label;
  }
  return full.length > 14 ? `${full.slice(0, 12)}…` : full;
}

function setChip(el: HTMLButtonElement, on: boolean): void {
  el.classList.toggle('active', on);
  el.setAttribute('aria-pressed', on ? 'true' : 'false');
}

function setAboutOpen(open: boolean): void {
  aboutOpen = open;
  aboutPanel.classList.toggle('hidden', !open);
  aboutBackdrop.classList.toggle('hidden', !open);
  aboutBackdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
  btnAbout.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) {
    aboutClose.focus();
  } else {
    btnAbout.focus();
  }
}

function syncCamButtons(): void {
  const live = inputMode === 'camera';
  btnCam.classList.toggle('active', live);
  btnCam.textContent = live ? 'Stop camera' : 'Start camera';
  btnCamQuick.disabled = cameraStarting;
  btnCamQuick.setAttribute('aria-label', live ? 'Stop camera' : 'Start camera');
  btnCamCompact.classList.toggle('hidden', !live);
  btnCamCompact.disabled = cameraStarting;
}

function setHudExpanded(open: boolean): void {
  hudExpanded = open;
  hud.dataset.state = open ? 'expanded' : 'collapsed';
  hudToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) hudPanel.removeAttribute('hidden');
  else hudPanel.setAttribute('hidden', '');
  const useScrim = open && (isCoarsePointer || window.innerWidth < 768);
  hudScrim.classList.toggle('hidden', !useScrim);
  hudScrim.setAttribute('aria-hidden', useScrim ? 'false' : 'true');
  paintStatus();
}

function setInputMode(mode: InputMode): void {
  inputMode = mode;
  setChip(btnDemo, mode === 'demo');
  syncCamButtons();
  demo.setEnabled(mode === 'demo');
  video.classList.toggle('live', mode === 'camera');
  if (mode === 'demo') {
    setStatus(DEMO_STATUS_FULL, DEMO_STATUS_SHORT);
    if (!cameraStarting) setBrandState('idle');
  }
}

async function ensureTracker(): Promise<HandTracker> {
  if (!tracker) {
    tracker = new HandTracker();
  }
  if (!tracker.ready) await tracker.init();
  return tracker;
}

async function enableCamera(): Promise<void> {
  if (cameraStarting) return;
  cameraStarting = true;
  setBrandState('loading');
  btnCam.disabled = true;
  syncCamButtons();
  let acquired: MediaStream | null = null;
  try {
    let modelDone = false;
    let camDone = false;
    const paintProgress = () => {
      if (!modelDone) setStatus('Loading hand model…', 'Loading…');
      else if (!camDone) setStatus('Requesting camera…', 'Camera…');
    };
    paintProgress();

    const tPromise = ensureTracker().then((t) => {
      modelDone = true;
      paintProgress();
      return t;
    });

    const streamPromise = navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      .then((stream) => {
        camDone = true;
        paintProgress();
        return stream;
      });

    const [t, stream] = await Promise.all([tPromise, streamPromise]);
    acquired = stream;
    await t.adoptStream(video, stream);

    setInputMode('camera');
    setStatus('Show your hand — pinch or spread fingers', 'Show hand');
    setBrandState('idle');
  } catch (err) {
    console.error(err);
    if (acquired) {
      acquired.getTracks().forEach((tr) => tr.stop());
    }
    setInputMode('demo');
    setBrandState('idle');
    const name = err instanceof DOMException ? err.name : '';
    const denied = name === 'NotAllowedError' || /NotAllowed|Permission|denied/i.test(String(err));
    const missing = name === 'NotFoundError' || /NotFound|no camera|DevicesNotFound/i.test(String(err));
    const busy = name === 'NotReadableError' || /NotReadable|track|in use/i.test(String(err));
    setStatus(
      denied
        ? 'Camera blocked — allow permission, or drag Demo orbs'
        : missing
          ? 'No camera found — drag Demo orbs instead'
          : busy
            ? 'Camera in use elsewhere — close other apps, or use Demo'
            : 'Camera failed — use Demo orbs, or retry Start camera',
      denied ? 'Blocked' : missing ? 'No cam' : busy ? 'Cam busy' : 'Cam fail',
    );
  } finally {
    cameraStarting = false;
    btnCam.disabled = false;
    syncCamButtons();
  }
}

function disableCamera(): void {
  tracker?.stopCamera(video);
  camLeft = null;
  camRight = null;
  lastHandsSeen = 0;
  lastTipCount = 0;
  setInputMode('demo');
  setBrandState('idle');
  setStatus(START_STATUS_FULL, START_STATUS_SHORT);
}

btnCam.addEventListener('click', () => {
  if (inputMode === 'camera') disableCamera();
  else void enableCamera();
});

btnCamQuick.addEventListener('click', () => {
  if (inputMode === 'camera') disableCamera();
  else void enableCamera();
});

btnCamCompact.addEventListener('click', () => {
  if (inputMode === 'camera') disableCamera();
});

btnDemo.addEventListener('click', () => {
  if (inputMode === 'camera') disableCamera();
  else setInputMode('demo');
});

chipAngles.addEventListener('click', () => {
  showAngles = !showAngles;
  setChip(chipAngles, showAngles);
});

chipEdges.addEventListener('click', () => {
  const on = !chipEdges.classList.contains('active');
  setChip(chipEdges, on);
  scene.setShowWire(on);
});

chipGuess.addEventListener('click', () => {
  const on = !chipGuess.classList.contains('active');
  setChip(chipGuess, on);
  guessPanel.classList.toggle('hidden', !on);
  revealed = false;
  guessResult.textContent = '';
});

chipShade.addEventListener('click', () => {
  const i = SHADE_CYCLE.indexOf(shadeMode);
  shadeMode = SHADE_CYCLE[(i + 1) % SHADE_CYCLE.length];
  scene.setShadeMode(shadeMode);
  chipShade.textContent = SHADE_LABEL[shadeMode];
  setChip(chipShade, shadeMode !== 'hybrid');
});

btnReveal.addEventListener('click', () => {
  revealed = true;
  const guess = Number(guessInput.value);
  if (!lastAngles.length) {
    guessResult.textContent = 'No angle yet — show a hand first';
    return;
  }
  const truth = lastAngles[0];
  if (Number.isFinite(guess)) {
    const err = Math.abs(guess - truth);
    guessResult.textContent = `True ${truth.toFixed(1)}° · you ${guess}° · err ${err.toFixed(1)}°`;
  } else {
    guessResult.textContent = `True angle ${truth.toFixed(1)}°`;
  }
});

btnAbout.addEventListener('click', (e) => {
  e.stopPropagation();
  setAboutOpen(!aboutOpen);
});

aboutBackdrop.addEventListener('click', () => {
  setAboutOpen(false);
});

aboutClose.addEventListener('click', () => {
  setAboutOpen(false);
});

document.addEventListener('visibilitychange', () => {
  const stream = video.srcObject as MediaStream | null;
  if (!stream || inputMode !== 'camera') return;
  const on = !document.hidden;
  for (const track of stream.getVideoTracks()) track.enabled = on;
});

hudToggle.addEventListener('click', () => {
  setHudExpanded(!hudExpanded);
});

hudScrim.addEventListener('click', () => {
  setHudExpanded(false);
});

app.addEventListener(
  'pointerdown',
  () => {
    if (!introStage) return;
    introStage = false;
    introAttracting = false;
    if (inputMode === 'demo') setBrandState('idle');
  },
  { passive: true },
);

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (aboutOpen) setAboutOpen(false);
    else if (hudExpanded) setHudExpanded(false);
  }
});

const labelPool: HTMLDivElement[] = Array.from({ length: 4 }, () => {
  const el = document.createElement('div');
  el.className = 'angle-tag';
  el.hidden = true;
  labelsRoot.appendChild(el);
  return el;
});

function paintLabels(
  angles: { deg: number; x: number; y: number }[],
  visible: boolean,
): void {
  const hideNumbers = chipGuess.classList.contains('active') && !revealed;
  for (let i = 0; i < labelPool.length; i++) {
    const el = labelPool[i];
    const a = visible ? angles[i] : undefined;
    if (!a) {
      el.hidden = true;
      continue;
    }
    el.hidden = false;
    el.style.left = `${a.x}px`;
    el.style.top = `${a.y}px`;
    el.textContent = hideNumbers ? '?' : `${a.deg.toFixed(0)}°`;
  }
}

/** 5s loop: hands settle → card → crystal bar → angles readable → reset. */
function driveMotionCapture(nowMs: number): void {
  const t = (nowMs % 5000) / 5000;
  const wave = 0.5 - 0.5 * Math.cos(t * Math.PI * 2);
  const bar = Math.min(1, Math.max(0, (wave - 0.15) / 0.7));
  const midX = 0.5;
  const half = 0.12 + bar * 0.2;
  const y = 0.52 + Math.sin(t * Math.PI * 2) * 0.02;
  demo.pinch.left = { x: midX - half, y: y + 0.01 };
  demo.pinch.right = { x: midX + half, y: y - 0.01 };
  demo.pinch.open = 0.07 + bar * 0.16;
  demo.pinch.spread = 0.35 + bar * 0.75;
}

function frame(): void {
  let left = null as ReturnType<typeof demo.toLandmarks>['left'] | null;
  let right = null as ReturnType<typeof demo.toLandmarks>['right'] | null;
  let mirrorX = false;
  let meshDriving = false;

  if (inputMode === 'demo') {
    if (motionCapture || introAttracting) driveMotionCapture(performance.now());
    const d = demo.toLandmarks();
    left = d.left;
    right = d.right;
    mirrorX = false;
    demo.syncHandles();
    meshDriving = true;
  } else if (tracker) {
    const det = tracker.detect(video);
    const hands = det.hands.length ? det.hands : tracker.listHands();
    const anchor = resolveAnchors(hands);
    lastHandsSeen = (hands.length >= 2 ? 2 : hands.length === 1 ? 1 : 0) as
      | 0
      | 1
      | 2;
    lastTipCount = anchor?.activeTips ?? 0;

    if (anchor) {
      camLeft = anchor.left;
      camRight = anchor.right;
    } else {
      camLeft = null;
      camRight = null;
    }

    const resolved = scene.resolveHands(camLeft, camRight);
    left = resolved.left;
    right = resolved.right;
    mirrorX = true;

    const now = performance.now();
    const meshLive = !resolved.held && !resolved.fading && !!anchor;
    meshDriving = !!(left && right) && (!resolved.fading || resolved.held);

    if (meshLive && !shareHintShown) {
      shareHintShown = true;
      shareHintUntil = now + 6000;
      setStatus('Screenshot it — tag #HoloPinch', 'Snap it');
    } else if (now < shareHintUntil) {
      // keep share hint
    } else if (!resolved.held && !resolved.fading) {
      if (!lastHandsSeen || lastTipCount === 0) {
        setStatus('Show your hand — pinch or spread fingers', 'Show hand');
      } else if (!anchor && lastHandsSeen >= 1) {
        setStatus('Spread fingers in frame', 'Spread…');
      } else {
        setStatus('Tracking — mesh follows your fingers', 'Tracking');
      }
    } else if (resolved.fading) {
      setStatus('Hands lost — fading…', 'Fading…');
    } else if (resolved.held) {
      setStatus('Hands lost — holding pose…', 'Holding…');
    }
  }

  const { angles, span, flatness } = scene.updateFromHands(left, right, mirrorX);
  lastAngles = angles.map((a) => a.deg);

  if (cameraStarting) {
    setBrandState('loading');
  } else if (inputMode === 'demo' && introStage) {
    setBrandState('intro');
  } else if (angles.length > 0 && meshDriving) {
    setBrandState('active');
  } else {
    setBrandState('idle');
  }

  if (angles.length) {
    const angText =
      chipGuess.classList.contains('active') && !revealed
        ? 'Angles hidden — guess, then Reveal'
        : `∠ ${angles.map((a) => a.deg.toFixed(0) + '°').join(' · ')}`;
    anglesReadout.textContent = debugTelemetry
      ? `${angText}  ·  span ${span.toFixed(2)}  ·  flat ${flatness.toFixed(2)}`
      : angText;
  } else {
    anglesReadout.textContent =
      inputMode === 'camera' ? 'Waiting for hand…' : '';
  }

  paintLabels(angles, showAngles && angles.length > 0);
  scene.render();
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => {
  scene.resize();
  demo.syncHandles();
});

scene.setShadeMode('hybrid');
scene.setShowWire(true);
setChip(chipAngles, showAngles);
chipShade.textContent = SHADE_LABEL.hybrid;
setHudExpanded(defaultHudExpanded);
setInputMode('demo');
if (motionCapture) {
  introStage = false;
  introAttracting = false;
  showAngles = false;
  setChip(chipAngles, false);
  setStatus('hold light', 'hold light');
  setBrandState('active');
} else if (!skipAutoCamera) {
  setStatus(START_STATUS_FULL, START_STATUS_SHORT);
  setBrandState('intro');
} else {
  setStatus(START_STATUS_FULL, START_STATUS_SHORT);
  setBrandState('intro');
}
scene.resize();
requestAnimationFrame(frame);
}
