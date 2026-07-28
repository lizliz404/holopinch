import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision';
import type { Landmark } from './landmarks';

export type { Landmark } from './landmarks';
export { TIP } from './landmarks';

export type TrackedHands = {
  left: Landmark[] | null;
  right: Landmark[] | null;
  /** Unordered hands this frame (0–2), for tip-anchor resolution. */
  hands: Landmark[][];
  raw: HandLandmarkerResult | null;
};

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';

export class HandTracker {
  private landmarker: HandLandmarker | null = null;
  private lastVideoTime = -1;
  private running = false;
  private lastResult: TrackedHands = {
    left: null,
    right: null,
    hands: [],
    raw: null,
  };

  async init(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  }

  async startCamera(video: HTMLVideoElement): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
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
  }

  stopCamera(video: HTMLVideoElement): void {
    this.running = false;
    const stream = video.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
  }

  detect(video: HTMLVideoElement): TrackedHands {
    if (!this.landmarker || !this.running || video.readyState < 2) {
      return { left: null, right: null, hands: [], raw: null };
    }

    const t = video.currentTime;
    // Same decoded frame — reuse last result so callers don't think hands vanished
    if (t === this.lastVideoTime) {
      return this.lastResult;
    }
    this.lastVideoTime = t;

    const result = this.landmarker.detectForVideo(video, performance.now());
    let left: Landmark[] | null = null;
    let right: Landmark[] | null = null;
    const ordered: Landmark[][] = [];

    const hands = result.landmarks ?? [];
    const handedness = result.handednesses ?? [];

    for (let i = 0; i < hands.length; i++) {
      const label = handedness[i]?.[0]?.categoryName ?? '';
      const pts = hands[i].map((p) => ({ x: p.x, y: p.y, z: p.z }));
      ordered.push(pts);
      if (label === 'Left') left = pts;
      else if (label === 'Right') right = pts;
      else if (!left) left = pts;
      else right = pts;
    }

    this.lastResult = { left, right, hands: ordered, raw: result };
    return this.lastResult;
  }

  /** Unordered landmark arrays from the last detect (0–2 hands). */
  listHands(): Landmark[][] {
    return this.lastResult.hands;
  }

  get ready(): boolean {
    return !!this.landmarker;
  }
}
