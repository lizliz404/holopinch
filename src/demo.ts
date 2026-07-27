import type { Landmark } from './hands';

export type DemoPinch = {
  left: { x: number; y: number };
  right: { x: number; y: number };
  /** Pinch opening in normalized units */
  open: number;
  /** Extra finger spread — grows section richness */
  spread: number;
};

/**
 * Mouse/touch-draggable two-hand simulator.
 * Drag handles = hand positions; wheel = pinch open; shift+wheel = finger spread.
 * Continuous — not two presets.
 */
export class DemoHands {
  pinch: DemoPinch = {
    left: { x: 0.34, y: 0.55 },
    right: { x: 0.66, y: 0.55 },
    open: 0.11,
    spread: 0.55,
  };

  private root: HTMLElement;
  private handles: { el: HTMLElement; side: 'left' | 'right' }[] = [];
  private dragging: 'left' | 'right' | null = null;
  enabled = true;

  constructor(root: HTMLElement) {
    this.root = root;
    this.mountHandles();
  }

  private mountHandles(): void {
    for (const side of ['left', 'right'] as const) {
      const el = document.createElement('div');
      el.className = `demo-handle ${side === 'right' ? 'right' : ''}`;
      el.dataset.side = side;
      el.title = side === 'left' ? 'Left hand' : 'Right hand';
      this.root.appendChild(el);
      this.handles.push({ el, side });

      el.addEventListener('pointerdown', (e: PointerEvent) => {
        if (!this.enabled) return;
        e.preventDefault();
        this.dragging = side;
        el.setPointerCapture(e.pointerId);
      });
    }

    window.addEventListener('pointermove', (e) => {
      if (!this.dragging || !this.enabled) return;
      const rect = this.root.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
      this.pinch[this.dragging] = { x, y };
      this.syncHandles();
    });
    window.addEventListener('pointerup', () => {
      this.dragging = null;
    });

    this.root.addEventListener(
      'wheel',
      (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        const dir = e.deltaY > 0 ? -1 : 1;
        if (e.shiftKey) {
          this.pinch.spread = Math.min(
            1.2,
            Math.max(0.15, this.pinch.spread + dir * 0.04),
          );
        } else {
          this.pinch.open = Math.min(
            0.35,
            Math.max(0.03, this.pinch.open + dir * 0.01),
          );
        }
      },
      { passive: false },
    );

    this.syncHandles();
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    for (const h of this.handles) {
      h.el.style.display = on ? 'block' : 'none';
    }
  }

  syncHandles(): void {
    const rect = this.root.getBoundingClientRect();
    for (const h of this.handles) {
      const p = this.pinch[h.side];
      h.el.style.left = `${p.x * rect.width}px`;
      h.el.style.top = `${p.y * rect.height}px`;
    }
  }

  /**
   * Synthetic 21-landmark hands. Finger tips fan with `spread` so section
   * shape continuously changes — pulling hands apart + spreading fingers
   * grows the solid from card-thin → crystal bar → fuller prism.
   */
  toLandmarks(timeMs = performance.now()): { left: Landmark[]; right: Landmark[] } {
    // Subtle breath so demo never looks frozen
    const breath = Math.sin(timeMs * 0.002) * 0.004;

    const mk = (cx: number, cy: number, side: 1 | -1): Landmark[] => {
      const pts: Landmark[] = Array.from({ length: 21 }, () => ({
        x: cx,
        y: cy,
        z: 0,
      }));
      const open = this.pinch.open + breath;
      const sp = this.pinch.spread;

      // Palm-ish base
      pts[0] = { x: cx - side * 0.01, y: cy + open * 0.15, z: 0.01 };

      // Thumb tip below-ish, index up — framing gesture
      pts[4] = {
        x: cx - side * open * 0.15 * sp,
        y: cy + open * 0.55,
        z: 0.0,
      };
      pts[8] = {
        x: cx + side * open * 0.05,
        y: cy - open * 0.55,
        z: -0.01,
      };
      pts[12] = {
        x: cx + side * open * 0.35 * sp,
        y: cy - open * 0.35 * sp,
        z: -0.02 * sp,
      };
      pts[16] = {
        x: cx + side * open * 0.5 * sp,
        y: cy - open * 0.05,
        z: -0.025 * sp,
      };
      pts[20] = {
        x: cx + side * open * 0.4 * sp,
        y: cy + open * 0.25 * sp,
        z: -0.015 * sp,
      };
      return pts;
    };

    return {
      left: mk(this.pinch.left.x, this.pinch.left.y, -1),
      right: mk(this.pinch.right.x, this.pinch.right.y, 1),
    };
  }
}
