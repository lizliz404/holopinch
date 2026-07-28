/**
 * MediaPipe HandLandmarker in a Web Worker.
 * Pattern: Google mediapipe-samples-web + damiansire backpressure client.
 * Main thread only ships ImageBitmap; worker returns plain landmarks.
 */
import {
  FilesetResolver,
  HandLandmarker,
} from '@mediapipe/tasks-vision';

// Self-hosted: same-origin avoids CDN cold-start + jsdelivr/storage latency.
const MODEL_URL = '/mediapipe/hand_landmarker.task';
const WASM_URL = '/mediapipe/wasm';

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

let landmarker: HandLandmarker | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const ac = new AbortController();
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      ac.abort();
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

function postProgress(stage: ProgressStage): void {
  self.postMessage({ type: 'progress', stage });
}

async function createLandmarker(delegate: 'GPU' | 'CPU'): Promise<HandLandmarker> {
  postProgress('wasm');
  const vision = await withTimeout(
    FilesetResolver.forVisionTasks(WASM_URL),
    STEP_TIMEOUT_MS,
    `WASM fetch (${delegate})`,
  );
  postProgress('model');
  const lm = await withTimeout(
    HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate,
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    }),
    STEP_TIMEOUT_MS,
    `Model load (${delegate})`,
  );
  postProgress('init');
  return lm;
}

async function init(): Promise<void> {
  try {
    landmarker = await createLandmarker('GPU');
    self.postMessage({ type: 'ready', delegate: 'GPU' });
  } catch (err) {
    console.warn('[HoloPinch worker] GPU failed; CPU', err);
    try {
      landmarker = await createLandmarker('CPU');
      self.postMessage({ type: 'ready', delegate: 'CPU' });
    } catch (err2) {
      const msg = err2 instanceof Error ? err2.message : String(err2);
      self.postMessage({ type: 'init-error', error: msg });
    }
  }
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
