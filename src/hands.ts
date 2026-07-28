import type { Landmark } from './landmarks';

export type { Landmark } from './landmarks';
export { TIP } from './landmarks';

export type TrackedHands = {
  left: Landmark[] | null;
  right: Landmark[] | null;
  /** Unordered hands this frame (0–2), for tip-anchor resolution. */
  hands: Landmark[][];
  raw: null;
};

export type InitStage = 'wasm' | 'model' | 'init' | null;

type WorkerHand = {
  landmarks: Landmark[];
  handedness: string;
};

type WorkerOut =
  | { type: 'ready'; delegate: string }
  | { type: 'init-error'; error: string }
  | { type: 'progress'; stage: 'wasm' | 'model' | 'init' }
  | { type: 'result'; hands: WorkerHand[] }
  | { type: 'detect-error'; error: string };

const empty: TrackedHands = {
  left: null,
  right: null,
  hands: [],
  raw: null,
};

const MAX_INIT_RETRIES = 3;
const INIT_TIMEOUT_MS = 60_000;
const RETRY_DELAY_MS = 3_000;

function packHands(list: WorkerHand[]): TrackedHands {
  let left: Landmark[] | null = null;
  let right: Landmark[] | null = null;
  const ordered: Landmark[][] = [];
  for (const h of list) {
    const pts = h.landmarks.map((p) => ({ x: p.x, y: p.y, z: p.z }));
    ordered.push(pts);
    const label = h.handedness;
    if (label === 'Left') left = pts;
    else if (label === 'Right') right = pts;
    else if (!left) left = pts;
    else right = pts;
  }
  return { left, right, hands: ordered, raw: null };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Camera hand tracker: MediaPipe in a Worker with single-frame backpressure.
 * `detect()` is non-blocking — returns last result; kicks a new inference when idle.
 */
export class HandTracker {
  private worker: Worker | null = null;
  private isReady = false;
  private running = false;
  private inFlight = false;
  private lastKickVideoTime = -1;
  private lastResult: TrackedHands = empty;
  private initPromise: Promise<void> | null = null;
  private _initProgress: InitStage = null;
  private initRetries = 0;

  get initProgress(): InitStage {
    return this._initProgress;
  }

  get attempt(): number {
    return this.initRetries;
  }

  async init(): Promise<void> {
    if (this.isReady) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.runInitWithRetries();
    try {
      await this.initPromise;
    } catch (err) {
      this.initPromise = null;
      throw err;
    }
  }

  private async runInitWithRetries(): Promise<void> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= MAX_INIT_RETRIES; attempt++) {
      this.initRetries = attempt;
      try {
        await this.initOnce();
        this._initProgress = null;
        return;
      } catch (err) {
        lastErr = err;
        this.teardownWorker();
        console.warn(`[HoloPinch] init attempt ${attempt}/${MAX_INIT_RETRIES} failed`, err);
        if (attempt < MAX_INIT_RETRIES) {
          await delay(RETRY_DELAY_MS);
        }
      }
    }
    this._initProgress = null;
    throw lastErr instanceof Error
      ? lastErr
      : new Error(String(lastErr ?? 'Hand model init failed'));
  }

  private teardownWorker(): void {
    try {
      this.worker?.terminate();
    } catch {
      /* ignore */
    }
    this.worker = null;
    this.isReady = false;
    this.inFlight = false;
    this._initProgress = null;
  }

  private initOnce(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fn();
      };

      const timer = setTimeout(() => {
        finish(() => {
          this.teardownWorker();
          reject(new Error(`Hand model init timed out after ${INIT_TIMEOUT_MS / 1000}s`));
        });
      }, INIT_TIMEOUT_MS);

      try {
        const worker = new Worker(new URL('./hands.worker.ts', import.meta.url), {
          type: 'module',
        });
        this.worker = worker;

        worker.onmessage = (ev: MessageEvent<WorkerOut>) => {
          const msg = ev.data;
          if (!msg) return;
          if (msg.type === 'progress') {
            this._initProgress = msg.stage;
            return;
          }
          if (msg.type === 'ready') {
            this.isReady = true;
            this._initProgress = null;
            this.bindRuntimeHandlers(worker);
            finish(() => resolve());
            return;
          }
          if (msg.type === 'init-error') {
            finish(() => {
              this.teardownWorker();
              reject(new Error(msg.error));
            });
            return;
          }
        };

        worker.onerror = (err) => {
          this.inFlight = false;
          finish(() => {
            this.teardownWorker();
            reject(
              err.error instanceof Error
                ? err.error
                : new Error(err.message || 'Worker crashed during init'),
            );
          });
        };

        worker.onmessageerror = () => {
          finish(() => {
            this.teardownWorker();
            reject(new Error('Worker message error during init'));
          });
        };

        worker.postMessage({ type: 'init' });
      } catch (err) {
        finish(() => reject(err));
      }
    });
  }

  private bindRuntimeHandlers(worker: Worker): void {
    worker.onmessage = (ev: MessageEvent<WorkerOut>) => {
      const msg = ev.data;
      if (!msg) return;
      if (msg.type === 'result') {
        this.inFlight = false;
        this.lastResult = packHands(msg.hands);
        return;
      }
      if (msg.type === 'detect-error') {
        this.inFlight = false;
        console.warn('[HoloPinch] worker detect:', msg.error);
      }
    };
    worker.onerror = (err) => {
      this.inFlight = false;
      console.warn('[HoloPinch] worker error:', err.message);
    };
    worker.onmessageerror = () => {
      this.inFlight = false;
      console.warn('[HoloPinch] worker messageerror');
    };
  }

  async startCamera(video: HTMLVideoElement): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 960 },
        height: { ideal: 540 },
      },
      audio: false,
    });
    await this.adoptStream(video, stream);
    return stream;
  }

  /** Attach an existing MediaStream and mark tracking live (no getUserMedia). */
  async adoptStream(video: HTMLVideoElement, stream: MediaStream): Promise<void> {
    const prev = video.srcObject as MediaStream | null;
    if (prev && prev !== stream) {
      prev.getTracks().forEach((t) => t.stop());
    }
    video.srcObject = stream;
    await video.play();
    this.running = true;
    this.lastKickVideoTime = -1;
  }

  stopCamera(video: HTMLVideoElement): void {
    this.running = false;
    this.inFlight = false;
    const stream = video.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
    this.lastResult = empty;
    this.lastKickVideoTime = -1;
  }

  /**
   * Non-blocking poll. Schedules worker inference when idle + new video frame.
   * Always returns the latest completed landmarks (may lag 1 frame — intentional).
   */
  detect(video: HTMLVideoElement): TrackedHands {
    if (!this.isReady || !this.running || !this.worker || video.readyState < 2) {
      return this.running ? this.lastResult : empty;
    }

    const t = video.currentTime;
    if (!this.inFlight && t !== this.lastKickVideoTime) {
      this.lastKickVideoTime = t;
      this.inFlight = true;
      const timestamp = performance.now();
      createImageBitmap(video)
        .then((bitmap) => {
          if (!this.worker || !this.running) {
            bitmap.close();
            this.inFlight = false;
            return;
          }
          this.worker.postMessage({ type: 'detect', bitmap, timestamp }, [bitmap]);
        })
        .catch((err) => {
          this.inFlight = false;
          console.warn('[HoloPinch] createImageBitmap failed', err);
        });
    }

    return this.lastResult;
  }

  listHands(): Landmark[][] {
    return this.lastResult.hands;
  }

  get ready(): boolean {
    return this.isReady;
  }

  dispose(): void {
    this.running = false;
    this.worker?.postMessage({ type: 'dispose' });
    this.teardownWorker();
    this.initPromise = null;
  }
}
