import type { Landmark } from './landmarks';
import { TIP } from './landmarks';

/** Tunable tip-gate thresholds for finger-structured input. */
export const ANCHOR = {
  minTipsTwoHandPerSide: 2,
  minTipsOneHandSplit: 4,
  minTipsOneHandPinch: 2,
  tipIndices: [4, 8, 12, 16, 20] as readonly number[],
};

export type AnchorMode = 'two-hand' | 'one-hand-split' | 'one-hand-pinch' | 'none';

export type AnchorPair = {
  mode: Exclude<AnchorMode, 'none'>;
  left: Landmark[];
  right: Landmark[];
  activeTips: number;
  handsSeen: 1 | 2;
};

function tipPresent(hand: Landmark[], idx: number): boolean {
  const p = hand[idx];
  return !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
}

/** Count usable tip landmarks among ANCHOR.tipIndices. */
export function countTips(hand: Landmark[]): number {
  let n = 0;
  for (const i of ANCHOR.tipIndices) {
    if (tipPresent(hand, i)) n++;
  }
  return n;
}

/** Ordered list of present tip landmarks (thumb→pinky). */
export function presentTips(hand: Landmark[]): Landmark[] {
  const out: Landmark[] = [];
  for (const i of ANCHOR.tipIndices) {
    if (tipPresent(hand, i)) out.push({ ...hand[i] });
  }
  return out;
}

function emptyHand(): Landmark[] {
  return Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
}

function cloneLm(p: Landmark): Landmark {
  return { x: p.x, y: p.y, z: p.z };
}

/** Build a 21-slot hand with tips placed at SECTION-friendly slots (4, 8, 12…). */
function handFromTipSlots(tips: Landmark[]): Landmark[] {
  const hand = emptyHand();
  const slots = [TIP.thumb, TIP.index, TIP.middle, TIP.ring, TIP.pinky];
  for (let i = 0; i < tips.length && i < slots.length; i++) {
    hand[slots[i]] = cloneLm(tips[i]);
  }
  return hand;
}

/** Second point beside a lone tip, using palm/wrist (or origin) as reference. */
function padBesideTip(tip: Landmark, ref: Landmark | undefined): Landmark {
  const r = ref ?? { x: tip.x, y: tip.y + 0.08, z: tip.z };
  const dx = tip.x - r.x;
  const dy = tip.y - r.y;
  const len = Math.hypot(dx, dy) || 0.04;
  // Perpendicular in image plane, ~12% of tip–ref length
  const s = 0.12 * len;
  return {
    x: tip.x - (dy / len) * s,
    y: tip.y + (dx / len) * s,
    z: tip.z,
  };
}

function wristOf(hand: Landmark[]): Landmark | undefined {
  const w = hand[0];
  if (w && Number.isFinite(w.x)) return w;
  return undefined;
}

function twoHandPair(a: Landmark[], b: Landmark[], activeTips: number): AnchorPair {
  return {
    mode: 'two-hand',
    left: a,
    right: b,
    activeTips,
    handsSeen: 2,
  };
}

function oneHandSplit(hand: Landmark[]): AnchorPair | null {
  const tips = countTips(hand);
  if (tips < ANCHOR.minTipsOneHandSplit) return null;
  if (!tipPresent(hand, TIP.thumb) || !tipPresent(hand, TIP.index)) return null;
  if (!tipPresent(hand, TIP.middle) || !tipPresent(hand, TIP.ring)) return null;

  const leftTips = [hand[TIP.thumb], hand[TIP.index]];
  const rightTips = [hand[TIP.middle], hand[TIP.ring]];
  if (tipPresent(hand, TIP.pinky)) rightTips.push(hand[TIP.pinky]);

  return {
    mode: 'one-hand-split',
    left: handFromTipSlots(leftTips),
    right: handFromTipSlots(rightTips),
    activeTips: tips,
    handsSeen: 1,
  };
}

function oneHandPinch(hand: Landmark[]): AnchorPair | null {
  const tips = presentTips(hand);
  if (tips.length < ANCHOR.minTipsOneHandPinch) return null;
  if (tips.length >= ANCHOR.minTipsOneHandSplit) return null;

  const wrist = wristOf(hand);
  const leftTips = [tips[0], tips[1]];
  let rightTips: Landmark[];

  if (tips.length >= 3) {
    const solo = tips[2];
    rightTips = [solo, padBesideTip(solo, wrist ?? tips[0])];
  } else {
    // Two tips only — thin mesh: B is a geometrically padded copy of the pair
    const mid = {
      x: (tips[0].x + tips[1].x) * 0.5,
      y: (tips[0].y + tips[1].y) * 0.5,
      z: (tips[0].z + tips[1].z) * 0.5,
    };
    const ox = (tips[0].x - tips[1].x) * 0.08;
    const oy = (tips[0].y - tips[1].y) * 0.08;
    rightTips = [
      { x: mid.x - oy, y: mid.y + ox, z: mid.z },
      { x: mid.x + oy, y: mid.y - ox, z: mid.z },
    ];
  }

  return {
    mode: 'one-hand-pinch',
    left: handFromTipSlots(leftTips),
    right: handFromTipSlots(rightTips),
    activeTips: tips.length,
    handsSeen: 1,
  };
}

/**
 * Resolve finger tip anchors for this frame.
 * Priority: two-hand → one-hand-split → one-hand-pinch → none.
 */
export function resolveAnchors(hands: Landmark[][]): AnchorPair | null {
  const live = hands.filter((h) => h && h.length >= 2);
  if (live.length >= 2) {
    // Stable left/right by image-space x (wrist), not MediaPipe detection order.
    const sorted = [...live].sort((ha, hb) => {
      const xa = ha[0]?.x ?? 0.5;
      const xb = hb[0]?.x ?? 0.5;
      return xa - xb;
    });
    const a = sorted[0];
    const b = sorted[1];
    const ta = countTips(a);
    const tb = countTips(b);
    if (
      ta >= ANCHOR.minTipsTwoHandPerSide &&
      tb >= ANCHOR.minTipsTwoHandPerSide
    ) {
      return twoHandPair(a, b, ta + tb);
    }
  }

  if (live.length === 1) {
    const hand = live[0];
    return oneHandSplit(hand) ?? oneHandPinch(hand);
  }

  // Two hands seen but tip counts too weak — try strongest single hand
  if (live.length >= 2) {
    const ranked = [...live].sort((x, y) => countTips(y) - countTips(x));
    return oneHandSplit(ranked[0]) ?? oneHandPinch(ranked[0]);
  }

  return null;
}
