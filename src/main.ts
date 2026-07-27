import './style.css';
import { DemoHands } from './demo';
import type { HandTracker } from './hands';
import { PrismScene, type ShadeMode } from './scene';

const app = document.querySelector<HTMLDivElement>('#app')!;
const video = document.querySelector<HTMLVideoElement>('#video')!;
const canvas = document.querySelector<HTMLCanvasElement>('#overlay')!;
const statusEl = document.querySelector<HTMLDivElement>('#status')!;
const anglesReadout = document.querySelector<HTMLDivElement>('#angles-readout')!;
const labelsRoot = document.querySelector<HTMLDivElement>('#angle-labels')!;
const btnCam = document.querySelector<HTMLButtonElement>('#btn-cam')!;
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
const btnAbout = document.querySelector<HTMLButtonElement>('#btn-about')!;
const aboutPanel = document.querySelector<HTMLDivElement>('#about-panel')!;
const aboutBackdrop = document.querySelector<HTMLDivElement>('#about-backdrop')!;

const debugTelemetry = new URLSearchParams(location.search).get('debug') === '1';
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
const DEMO_STATUS = isCoarsePointer
  ? 'Demo — drag orbs · two-finger vertical = pinch open · two-finger horizontal = finger spread'
  : 'Demo — drag orbs · scroll = pinch open · Shift+scroll = finger spread';

const demo = new DemoHands(app);

function showWebGlFallback(): void {
  const msg = document.createElement('div');
  msg.id = 'webgl-fallback';
  msg.innerHTML =
    '<p><strong>WebGL is unavailable</strong> in this browser — HoloPinch needs it to render the hologram. Try a current Chrome/Safari.</p>';
  app.appendChild(msg);
  canvas.style.display = 'none';
  hud.style.display = 'none';
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

type Detected = ReturnType<HandTracker['detect']>;
let camLeft: Detected['left'] = null;
let camRight: Detected['right'] = null;
let lastDetectHadLeft = false;
let lastDetectHadRight = false;

let shareHintShown = false;
let shareHintUntil = 0;
let aboutOpen = false;

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

function setInputMode(mode: InputMode): void {
  inputMode = mode;
  setChip(btnDemo, mode === 'demo');
  btnCam.classList.toggle('active', mode === 'camera');
  btnCam.textContent = mode === 'camera' ? 'Stop camera' : 'Start camera';
  demo.setEnabled(mode === 'demo');
  video.classList.toggle('live', mode === 'camera');
  if (mode === 'demo') {
    setStatus(DEMO_STATUS);
  }
}

async function enableCamera(): Promise<void> {
  if (cameraStarting) return;
  cameraStarting = true;
  btnCam.disabled = true;
  try {
    setStatus('Loading hand model…');
    if (!tracker) {
      const mod = await import('./hands');
      tracker = new mod.HandTracker();
    }
    if (!tracker.ready) await tracker.init();
    setStatus('Requesting camera permission…');
    await tracker.startCamera(video);
    setInputMode('camera');
    setStatus('Camera on — show both hands and pinch');
  } catch (err) {
    console.error(err);
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
  }
}

function disableCamera(): void {
  tracker?.stopCamera(video);
  camLeft = null;
  camRight = null;
  lastDetectHadLeft = false;
  lastDetectHadRight = false;
  setInputMode('demo');
}

btnCam.addEventListener('click', () => {
  if (inputMode === 'camera') disableCamera();
  else void enableCamera();
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
    guessResult.textContent = 'No angle yet — frame both hands first';
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

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && aboutOpen) setAboutOpen(false);
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

function frame(): void {
  let left = null as ReturnType<typeof demo.toLandmarks>['left'] | null;
  let right = null as ReturnType<typeof demo.toLandmarks>['right'] | null;
  let mirrorX = false;

  if (inputMode === 'demo') {
    const d = demo.toLandmarks();
    left = d.left;
    right = d.right;
    mirrorX = false;
    demo.syncHandles();
  } else if (tracker) {
    const det = tracker.detect(video);
    lastDetectHadLeft = !!det.left;
    lastDetectHadRight = !!det.right;
    camLeft = det.left;
    camRight = det.right;

    const resolved = scene.resolveHands(camLeft, camRight);
    left = resolved.left;
    right = resolved.right;
    mirrorX = true;

    const now = performance.now();
    const meshLive =
      !resolved.held &&
      !resolved.fading &&
      lastDetectHadLeft &&
      lastDetectHadRight;

    if (meshLive && !shareHintShown) {
      shareHintShown = true;
      shareHintUntil = now + 6000;
      setStatus('Screenshot it — tag #HoloPinch');
    } else if (now < shareHintUntil) {
      // keep share hint on the status line
    } else if (!resolved.held && !resolved.fading) {
      if (lastDetectHadLeft !== lastDetectHadRight) {
        setStatus('Show both hands');
      } else if (!lastDetectHadLeft && !lastDetectHadRight) {
        setStatus('Camera on — show both hands and pinch');
      } else {
        setStatus('Tracking — mesh follows your pinch');
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
      inputMode === 'camera' ? 'Waiting for both hands…' : '';
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
setInputMode('demo');
scene.resize();
requestAnimationFrame(frame);
}
