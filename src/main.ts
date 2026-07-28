import './style.css';
import { resolveAnchors, type AnchorPair } from './anchors';
import { DemoHands } from './demo';
import type { HandTracker } from './hands';
import { PrismScene, type ShadeMode } from './scene';

const app = document.querySelector<HTMLDivElement>('#app')!;
const video = document.querySelector<HTMLVideoElement>('#video')!;
const canvas = document.querySelector<HTMLCanvasElement>('#overlay')!;
const statusEl = document.querySelector<HTMLElement>('#status')!;
const anglesReadout = document.querySelector<HTMLDivElement>('#angles-readout')!;
const labelsRoot = document.querySelector<HTMLDivElement>('#angle-labels')!;
const btnCam = document.querySelector<HTMLButtonElement>('#btn-cam')!;
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
const aboutPanel = document.querySelector<HTMLDivElement>('#about-panel')!;
const aboutBackdrop = document.querySelector<HTMLDivElement>('#about-backdrop')!;

const params = new URLSearchParams(location.search);
const debugTelemetry = params.get('debug') === '1';
/** Auto-play card→bar continuum for social motion capture (no camera). */
const motionCapture = params.get('motion') === '1';
/** Hide chrome for cleaner recordings. */
const cleanCapture = params.get('clean') === '1' || motionCapture;
const skipAutoCamera = motionCapture || params.get('clean') === '1';
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
const defaultHudExpanded = window.matchMedia(
  '(pointer: fine) and (min-width: 768px)',
).matches;
const DEMO_STATUS = isCoarsePointer
  ? 'Demo — drag orbs · two-finger vertical = pinch open · two-finger horizontal = finger spread'
  : 'Demo — drag orbs · scroll = pinch open · Shift+scroll = finger spread';

const demo = new DemoHands(app);

if (cleanCapture) {
  document.documentElement.classList.add('capture-clean');
  hud.classList.add('capture-hidden');
  hudScrim.classList.add('capture-hidden');
  btnAbout.classList.add('capture-hidden');
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
  btnAbout.style.display = 'none';
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
let showAngles = true;
let shadeMode: ShadeMode = 'hybrid';

let camLeft: AnchorPair['left'] | null = null;
let camRight: AnchorPair['right'] | null = null;
let lastHandsSeen: 0 | 1 | 2 = 0;
let lastTipCount = 0;

let shareHintShown = false;
let shareHintUntil = 0;
let aboutOpen = false;
let hudExpanded = defaultHudExpanded;

function setStatus(msg: string): void {
  statusEl.textContent = msg;
}

function setChip(el: HTMLButtonElement, on: boolean): void {
  el.classList.toggle('active', on);
  el.setAttribute('aria-pressed', on ? 'true' : 'false');
}

function setAboutOpen(open: boolean): void {
  aboutOpen = open;
  aboutPanel.classList.toggle('hidden', !open);
  aboutBackdrop.classList.toggle('hidden', !open);
  btnAbout.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function syncCamButtons(): void {
  const live = inputMode === 'camera';
  btnCam.classList.toggle('active', live);
  btnCam.textContent = live ? 'Stop camera' : 'Retry camera';
  btnCamCompact.classList.toggle('hidden', !live);
  btnCamCompact.disabled = cameraStarting;
}

function setHudExpanded(open: boolean): void {
  hudExpanded = open;
  hud.dataset.state = open ? 'expanded' : 'collapsed';
  hudToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) hudPanel.removeAttribute('hidden');
  else hudPanel.setAttribute('hidden', '');
  // Transparent scrim on coarse / narrow when expanded
  const useScrim = open && (isCoarsePointer || window.innerWidth < 768);
  hudScrim.classList.toggle('hidden', !useScrim);
  hudScrim.setAttribute('aria-hidden', useScrim ? 'false' : 'true');
}

function setInputMode(mode: InputMode): void {
  inputMode = mode;
  setChip(btnDemo, mode === 'demo');
  syncCamButtons();
  demo.setEnabled(mode === 'demo');
  video.classList.toggle('live', mode === 'camera');
  if (mode === 'demo') {
    setStatus(DEMO_STATUS);
  }
}

async function ensureTracker(): Promise<HandTracker> {
  if (!tracker) {
    const mod = await import('./hands');
    tracker = new mod.HandTracker();
  }
  if (!tracker.ready) await tracker.init();
  return tracker;
}

async function enableCamera(): Promise<void> {
  if (cameraStarting) return;
  cameraStarting = true;
  btnCam.disabled = true;
  syncCamButtons();
  let acquired: MediaStream | null = null;
  try {
    let modelDone = false;
    let camDone = false;
    const paintProgress = () => {
      if (!modelDone) setStatus('Loading hand model…');
      else if (!camDone) setStatus('Requesting camera…');
    };
    paintProgress();

    // Parallel: MediaPipe WASM/model + getUserMedia (fastest permission UX)
    const tPromise = ensureTracker().then((t) => {
      modelDone = true;
      paintProgress();
      return t;
    });

    const streamPromise = navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    }).then((stream) => {
      camDone = true;
      paintProgress();
      return stream;
    });

    const [t, stream] = await Promise.all([tPromise, streamPromise]);
    acquired = stream;
    await t.adoptStream(video, stream);

    setInputMode('camera');
    setStatus('Show your hand — pinch or spread fingers');
  } catch (err) {
    console.error(err);
    if (acquired) {
      acquired.getTracks().forEach((tr) => tr.stop());
    }
    setInputMode('demo');
    const msg = err instanceof Error ? err.message : String(err);
    const denied =
      /NotAllowed|Permission|denied/i.test(msg) ||
      (err instanceof DOMException && err.name === 'NotAllowedError');
    setStatus(
      denied
        ? 'Camera blocked — allow permission, or use Demo'
        : `Camera failed: ${msg} · using Demo`,
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
}

btnCam.addEventListener('click', () => {
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
    guessResult.textContent = 'No angle yet — show your hand first';
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

btnAbout.addEventListener('click', () => {
  setAboutOpen(!aboutOpen);
});

aboutBackdrop.addEventListener('click', () => {
  setAboutOpen(false);
});

hudToggle.addEventListener('click', () => {
  setHudExpanded(!hudExpanded);
});

hudScrim.addEventListener('click', () => {
  setHudExpanded(false);
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (aboutOpen) setAboutOpen(false);
    else if (hudExpanded) setHudExpanded(false);
  }
});

function paintLabels(
  angles: { deg: number; x: number; y: number }[],
  visible: boolean,
): void {
  labelsRoot.innerHTML = '';
  if (!visible) return;
  const hideNumbers = chipGuess.classList.contains('active') && !revealed;
  for (const a of angles) {
    const el = document.createElement('div');
    el.className = 'angle-tag';
    el.style.left = `${a.x}px`;
    el.style.top = `${a.y}px`;
    el.textContent = hideNumbers ? '?' : `${a.deg.toFixed(0)}°`;
    labelsRoot.appendChild(el);
  }
}

/** 5s loop: hands settle → card → crystal bar → angles readable → reset. */
function driveMotionCapture(nowMs: number): void {
  const t = (nowMs % 5000) / 5000;
  // Ease in-out along continuum
  const wave = 0.5 - 0.5 * Math.cos(t * Math.PI * 2);
  // 0..0.45 card-ish, 0.45..1 bar-ish
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

  if (inputMode === 'demo') {
    if (motionCapture) driveMotionCapture(performance.now());
    const d = demo.toLandmarks();
    left = d.left;
    right = d.right;
    mirrorX = false;
    demo.syncHandles();
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

    if (meshLive && !shareHintShown) {
      shareHintShown = true;
      shareHintUntil = now + 6000;
      setStatus('Screenshot it — tag #HoloPinch');
    } else if (now < shareHintUntil) {
      // keep share hint on the status line
    } else if (!resolved.held && !resolved.fading) {
      if (!lastHandsSeen || lastTipCount === 0) {
        setStatus('Show your hand — pinch or spread fingers');
      } else if (!anchor && lastHandsSeen >= 1) {
        setStatus('Spread fingers in frame');
      } else {
        setStatus('Tracking — mesh follows your fingers');
      }
    } else if (resolved.fading) {
      setStatus('Hands lost — fading…');
    } else if (resolved.held) {
      setStatus('Hands lost — holding pose…');
    }
  }

  const { angles, span, flatness } = scene.updateFromHands(left, right, mirrorX);
  lastAngles = angles.map((a) => a.deg);

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
chipShade.textContent = SHADE_LABEL.hybrid;
setHudExpanded(defaultHudExpanded);
setInputMode('demo');
if (motionCapture) {
  showAngles = true;
  setChip(chipAngles, true);
  setStatus('hold light');
} else if (!skipAutoCamera) {
  setStatus('Loading hand model…');
  void enableCamera();
}
scene.resize();
requestAnimationFrame(frame);
}
