import './style.css';
import './styles/premium-one-pager.css';
import { resolveAnchors, type AnchorPair } from './anchors';
import { DemoHands } from './demo';
import { HandTracker } from './hands';
import { applyDom, lang, setLang, t } from './i18n';
import { initPremiumOnePager } from './lib/premium-one-pager';
import { PrismScene, type ShadeMode } from './scene';

// Apply i18n to static DOM before any interaction
applyDom();

// 附 A light: progress + noise + selection/scrollbar/prm. Skip chapter dots (single-screen toy).
// No pop-reveal on hero — LCP brand must stay visible.
initPremiumOnePager({
  enableChapters: false,
  enableReveal: false,
  enableProgress: true,
  enableNoise: true,
});

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

/* ── i18n-dependent constants: re-initialized by initDynamicStrings() ── */
let DEMO_STATUS_FULL: string;
let DEMO_STATUS_SHORT: string;
let START_STATUS_FULL: string;
let START_STATUS_SHORT: string;
let SHADE_LABEL: Record<ShadeMode, string>;
let SHORT_LABEL: [string, string][];

function initDynamicStrings(): void {
  DEMO_STATUS_FULL = isCoarsePointer ? t('demoFull') : t('demoFullDesktop');
  DEMO_STATUS_SHORT = t('demoShort');
  START_STATUS_FULL = t('startFull');
  START_STATUS_SHORT = t('startShort');
  SHADE_LABEL = {
    hybrid: t('shadeHybrid'),
    holo: t('shadeHolo'),
    normal: t('shadeNormal'),
  };
  SHORT_LABEL = [
    [t('loadingWasm'), t('shortWasm')],
    [t('loadingModel'), t('shortModel')],
    [t('loadingInit'), t('shortLoading')],
    [t('loadingGeneric'), t('shortLoading')],
    [t('requestingCamera'), t('shortCamera')],
    [t('statusShowHand'), t('shortShowHand')],
    [t('statusSpread'), t('shortSpread')],
    [t('statusTracking'), t('shortTracking')],
    [t('statusShareHint'), t('shortSnapIt')],
    [t('statusFading'), t('shortFading')],
    [t('statusHolding'), t('shortHolding')],
    [t('statusModelFail'), t('shortModelFail')],
    [t('statusCamBlocked'), t('shortBlocked')],
    [t('statusNoCam'), t('shortNoCam')],
    [t('statusCamBusy'), t('shortCamBusy')],
    [t('statusCamFail'), t('shortCamFail')],
    [DEMO_STATUS_FULL, DEMO_STATUS_SHORT],
    [t('demoFullDesktop'), DEMO_STATUS_SHORT],
  ];
}
/** Keep in emitted JS so Cloudflare custom-domain asset URLs rotate after cache poison. */
const BUILD_ID = 'module-wasm-loader-2026-07-28c';
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
  msg.innerHTML = `<p>${t('webglFallback')}</p>`;
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
let statusFull = t('loadingGeneric');
let statusShort = t('shortLoading');

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

/** Map full status strings → short labels for the collapsed pill. */
function shortenStatus(full: string): string {
  for (const [long, short] of SHORT_LABEL) {
    if (full === long) return short;
  }
  return full.length > 14 ? `${full.slice(0, 12)}…` : full;
}

function setChip(el: HTMLButtonElement, on: boolean): void {
  el.classList.toggle('active', on);
  el.setAttribute('aria-pressed', on ? 'true' : 'false');
}

const ABOUT_FADE_MS = 300;
let aboutTimer: ReturnType<typeof setTimeout> | null = null;

function setAboutOpen(open: boolean): void {
  aboutOpen = open;
  if (aboutTimer) {
    clearTimeout(aboutTimer);
    aboutTimer = null;
  }
  aboutBackdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
  btnAbout.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) {
    aboutPanel.style.display = '';
    aboutBackdrop.style.display = '';
    void aboutPanel.offsetWidth;
    aboutPanel.classList.remove('hidden');
    aboutBackdrop.classList.remove('hidden');
    aboutClose.focus();
  } else {
    aboutPanel.classList.add('hidden');
    aboutBackdrop.classList.add('hidden');
    aboutTimer = setTimeout(() => {
      if (!aboutOpen) {
        aboutPanel.style.display = 'none';
        aboutBackdrop.style.display = 'none';
      }
      aboutTimer = null;
    }, ABOUT_FADE_MS);
    btnAbout.focus();
  }
}

function syncCamButtons(): void {
  const live = inputMode === 'camera';
  btnCam.classList.toggle('active', live);
  btnCam.textContent = live ? t('btnStopCam') : t('btnRetryCam');
  btnCamQuick.disabled = cameraStarting;
  btnCamQuick.setAttribute('aria-label', live ? t('ariaStopCam') : t('ariaStartCam'));
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

function liveVideoStream(): MediaStream | null {
  const existing = video.srcObject as MediaStream | null;
  if (!existing) return null;
  const live = existing.getVideoTracks().some((t) => t.readyState === 'live');
  return live ? existing : null;
}

function setCameraPermissionStatus(err: unknown): void {
  const name = err instanceof DOMException ? err.name : '';
  const denied = name === 'NotAllowedError' || /NotAllowed|Permission|denied/i.test(String(err));
  const missing = name === 'NotFoundError' || /NotFound|no camera|DevicesNotFound/i.test(String(err));
  const busy = name === 'NotReadableError' || /NotReadable|track|in use/i.test(String(err));
  setStatus(
    denied
      ? t('statusCamBlocked')
      : missing
        ? t('statusNoCam')
        : busy
          ? t('statusCamBusy')
          : t('statusCamFail'),
    denied ? t('shortBlocked') : missing ? t('shortNoCam') : busy ? t('shortCamBusy') : t('shortCamFail'),
  );
}

async function enableCamera(): Promise<void> {
  if (cameraStarting) return;
  cameraStarting = true;
  setBrandState('loading');
  btnCam.disabled = true;
  syncCamButtons();
  let acquired: MediaStream | null = null;
  let keepStream = false;
  let progressIv: ReturnType<typeof setInterval> | null = null;
  try {
    if (!tracker) tracker = new HandTracker();

    let modelDone = false;
    let camDone = !!liveVideoStream();
    const paintProgress = () => {
      if (!modelDone) {
        const stage = tracker?.initProgress;
        if (stage === 'wasm') setStatus(t('loadingWasm'), t('shortWasm'));
        else if (stage === 'model') setStatus(t('loadingModel'), t('shortModel'));
        else if (stage === 'init') setStatus(t('loadingInit'), t('shortLoading'));
        else setStatus(t('loadingGeneric'), t('shortLoading'));
      } else if (!camDone) {
        setStatus(t('requestingCamera'), t('shortCamera'));
      }
    };
    paintProgress();
    progressIv = setInterval(paintProgress, 250);

    const tPromise = tracker.init().then(() => {
      modelDone = true;
      paintProgress();
      return tracker!;
    });

    const existing = liveVideoStream();
    const streamPromise = existing
      ? Promise.resolve(existing).then((stream) => {
          camDone = true;
          paintProgress();
          return stream;
        })
      : navigator.mediaDevices
          .getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 960 },
              height: { ideal: 540 },
            },
            audio: false,
          })
          .then((stream) => {
            camDone = true;
            acquired = stream;
            paintProgress();
            return stream;
          });

    const [tResult, sResult] = await Promise.allSettled([tPromise, streamPromise]);
    if (progressIv) {
      clearInterval(progressIv);
      progressIv = null;
    }

    if (tResult.status === 'fulfilled' && sResult.status === 'fulfilled') {
      const trackerInstance = tResult.value;
      const stream = sResult.value;
      acquired = stream;
      await trackerInstance.adoptStream(video, stream);
      keepStream = true;
      setInputMode('camera');
      setStatus(t('statusShowHand'), t('shortShowHand'));
      setBrandState('idle');
      return;
    }

    if (sResult.status === 'rejected') {
      console.error(sResult.reason);
      setInputMode('demo');
      setBrandState('idle');
      introAttracting = false;
      setCameraPermissionStatus(sResult.reason);
      return;
    }

    // Camera OK, model failed — keep stream, fall back to Demo; Retry reloads model.
    console.error(tResult.status === 'rejected' ? tResult.reason : 'model init failed');
    const stream: MediaStream = sResult.value;
    acquired = stream;
    const prev = video.srcObject as MediaStream | null;
    if (prev && prev !== stream) {
      prev.getTracks().forEach((tr) => tr.stop());
    }
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      /* autoplay may fail; stream still held for retry */
    }
    keepStream = true;
    setInputMode('demo');
    setBrandState('idle');
    introAttracting = false;
    setStatus(t('statusModelFail'), t('shortModelFail'));
  } catch (err) {
    console.error(err);
    if (acquired && !keepStream) {
      acquired.getTracks().forEach((tr) => tr.stop());
    }
    setInputMode('demo');
    setBrandState('idle');
    introAttracting = false;
    setCameraPermissionStatus(err);
  } finally {
    if (progressIv) clearInterval(progressIv);
    if (acquired && !keepStream) {
      acquired.getTracks().forEach((tr) => tr.stop());
    }
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

// Language switcher: client-side swap, no page reload → no model re-fetch
const btnLang = document.querySelector<HTMLButtonElement>('#btn-lang')!;
btnLang.addEventListener('click', () => {
  setLang(lang() === 'zh' ? 'en' : 'zh');
  initDynamicStrings();
  syncCamButtons();
  chipShade.textContent = SHADE_LABEL[shadeMode];
  // Re-paint current status in new locale
  if (inputMode === 'demo') {
    setStatus(DEMO_STATUS_FULL, DEMO_STATUS_SHORT);
  } else {
    setStatus(t('statusShowHand'), t('shortShowHand'));
  }
});

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
    guessResult.textContent = t('guessNoAngle');
    return;
  }
  const truth = lastAngles[0];
  if (Number.isFinite(guess)) {
    const err = Math.abs(guess - truth);
    guessResult.textContent = lang() === 'zh'
      ? `真实 ${truth.toFixed(1)}° · 你猜 ${guess}° · 误差 ${err.toFixed(1)}°`
      : `True ${truth.toFixed(1)}° · you ${guess}° · err ${err.toFixed(1)}°`;
  } else {
    guessResult.textContent = lang() === 'zh'
      ? `真实角度 ${truth.toFixed(1)}°`
      : `True angle ${truth.toFixed(1)}°`;
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
      setStatus(t('statusShareHint'), t('shortSnapIt'));
    } else if (now < shareHintUntil) {
      // keep share hint
    } else if (!resolved.held && !resolved.fading) {
      if (!lastHandsSeen || lastTipCount === 0) {
        setStatus(t('statusShowHand'), t('shortShowHand'));
      } else if (!anchor && lastHandsSeen >= 1) {
        setStatus(t('statusSpread'), t('shortSpread'));
      } else {
        setStatus(t('statusTracking'), t('shortTracking'));
      }
    } else if (resolved.fading) {
      setStatus(t('statusFading'), t('shortFading'));
    } else if (resolved.held) {
      setStatus(t('statusHolding'), t('shortHolding'));
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
        ? t('anglesHidden')
        : `∠ ${angles.map((a) => a.deg.toFixed(0) + '°').join(' · ')}`;
    anglesReadout.textContent = debugTelemetry
      ? `${angText}  ·  span ${span.toFixed(2)}  ·  flat ${flatness.toFixed(2)}`
      : angText;
  } else {
    anglesReadout.textContent =
      inputMode === 'camera' ? t('anglesWaiting') : '';
  }

  paintLabels(angles, showAngles && angles.length > 0);
  scene.render();
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => {
  scene.resize();
  demo.syncHandles();
});

initDynamicStrings();
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
  setStatus(t('motionHoldLight'), t('motionHoldLight'));
  setBrandState('active');
} else if (!skipAutoCamera) {
  setStatus(START_STATUS_FULL, START_STATUS_SHORT);
  setBrandState('intro');
  void enableCamera();
} else {
  setStatus(START_STATUS_FULL, START_STATUS_SHORT);
  setBrandState('intro');
}
scene.resize();
requestAnimationFrame(frame);
}
