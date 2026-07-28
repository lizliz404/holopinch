/**
 * MediaPipe HandLandmarker in a Web Worker.
 * Pattern: Google mediapipe-samples-web + damiansire backpressure client.
 * Main thread only ships ImageBitmap; worker returns plain landmarks.
 *
 * Critical: Vite workers are ES modules. MediaPipe's classic wasm loader
 * (`vision_wasm_internal.js`) is designed for `importScripts()` and does not
 * export `ModuleFactory` under dynamic `import()`. Module workers must use
 * `FilesetResolver.forVisionTasks(path, true)` → `vision_wasm_module_internal.*`
 * (see mediapipe-samples-web BaseWorker.getVisionFileset).
 */
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

type VisionFileset = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;

const SELF_MODEL_URL = '/mediapipe/hand_landmarker.task';
const SELF_WASM_URL = '/mediapipe/wasm';

const CDN_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const CDN_WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';

const STEP_TIMEOUT_MS = 30_000;

type InitMsg = { type: 'init' };
type DetectMsg = {
  type: 'detect';
  bitmap: ImageBitmap;
  timestamp: number;
};
type DisposeMsg = { type: 'dispose' };
type InMsg = InitMsg | DetectMsg | DisposeMsg;

type ProgressStage = 'wasm' | 'model' | 'init';

type AssetSource = {
  label: 'self' | 'cdn';
  wasmUrl: string;
  modelUrl: string;
};

const SOURCES: AssetSource[] = [
  { label: 'self', wasmUrl: SELF_WASM_URL, modelUrl: SELF_MODEL_URL },
  { label: 'cdn', wasmUrl: CDN_WASM_URL, modelUrl: CDN_MODEL_URL },
];

let landmarker: HandLandmarker | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function formatErr(err: unknown): string {
  if (err instanceof Error) {
    return err.stack ? `${err.message}\n${err.stack}` : err.message;
  }
  return String(err);
}

function stepError(step: string, source: AssetSource, delegate: string, err: unknown): Error {
  return new Error(`[${source.label}/${delegate}] ${step}: ${formatErr(err)}`);
}

function postProgress(stage: ProgressStage): void {
  self.postMessage({ type: 'progress', stage });
}

async function resolveFileset(source: AssetSource, delegate: string): Promise<VisionFileset> {
  // Second arg `true` = ES module wasm loader (required in module Workers).
  // Classic vision_wasm_internal.js has no `export default` / no globalThis.ModuleFactory
  // under dynamic import(), so module Workers hit "ModuleFactory not set".
  try {
    const fileset = await withTimeout(
      FilesetResolver.forVisionTasks(source.wasmUrl, true),
      STEP_TIMEOUT_MS,
      `fileset resolve`,
    );
    // Helpful breadcrumb in worker console / init-error dumps.
    console.info(
      `[HoloPinch worker] fileset ${source.label}:`,
      String(fileset.wasmLoaderPath),
      String(fileset.wasmBinaryPath),
    );
    return fileset;
  } catch (err) {
    throw stepError('fileset resolve (SIMD/path)', source, delegate, err);
  }
}

async function createLandmarker(
  source: AssetSource,
  delegate: 'GPU' | 'CPU',
): Promise<HandLandmarker> {
  postProgress('wasm');
  const vision = await resolveFileset(source, delegate);

  postProgress('model');
  try {
    const lm = await withTimeout(
      HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: source.modelUrl,
          delegate,
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      }),
      STEP_TIMEOUT_MS,
      `createFromOptions`,
    );
    postProgress('init');
    return lm;
  } catch (err) {
    throw stepError(
      `createFromOptions loader=${vision.wasmLoaderPath} wasm=${vision.wasmBinaryPath} model=${source.modelUrl}`,
      source,
      delegate,
      err,
    );
  }
}

async function init(): Promise<void> {
  const errors: string[] = [];

  for (const source of SOURCES) {
    for (const delegate of ['GPU', 'CPU'] as const) {
      try {
        landmarker = await createLandmarker(source, delegate);
        self.postMessage({
          type: 'ready',
          delegate: `${delegate}@${source.label}`,
        });
        return;
      } catch (err) {
        const msg = formatErr(err);
        errors.push(msg);
        console.warn(`[HoloPinch worker] ${source.label}/${delegate} failed`, err);
      }
    }
  }

  self.postMessage({
    type: 'init-error',
    error: errors.join('\n---\n') || 'Hand model init failed (no attempts)',
  });
}

function detect(bitmap: ImageBitmap, timestamp: number): void {
  if (!landmarker) {
    bitmap.close();
    self.postMessage({ type: 'detect-error', error: 'not ready' });
    return;
  }
  try {
    const result = landmarker.detectForVideo(bitmap, timestamp);
    const hands: { landmarks: { x: number; y: number; z: number }[]; handedness: string }[] =
      [];
    const lms = result.landmarks ?? [];
    const handed = result.handednesses ?? [];
    for (let i = 0; i < lms.length; i++) {
      hands.push({
        landmarks: lms[i].map((p) => ({ x: p.x, y: p.y, z: p.z })),
        handedness: handed[i]?.[0]?.categoryName ?? '',
      });
    }
    self.postMessage({ type: 'result', hands });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    self.postMessage({ type: 'detect-error', error: msg });
  } finally {
    bitmap.close();
  }
}

self.onmessage = (ev: MessageEvent<InMsg>) => {
  const data = ev.data;
  if (!data || typeof data !== 'object') return;
  if (data.type === 'init') {
    void init();
    return;
  }
  if (data.type === 'detect') {
    detect(data.bitmap, data.timestamp);
    return;
  }
  if (data.type === 'dispose') {
    landmarker?.close?.();
    landmarker = null;
  }
};
