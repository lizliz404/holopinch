import type { Landmark } from './landmarks';

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
 * Touch: two-finger vertical = open; two-finger horizontal = spread.
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
  private dragging: { side: 'left' | 'right'; pointerId: number } | null = null;
  private pointers = new Map<number, { x: number; y: number }>();
  private twoFingerLast: { x: number; y: number } | null = null;
  enabled = true;

  constructor(root: HTMLElement) {
    this.root = root;
    this.mountHandles();
  }

  private midpoint(): { x: number; y: number } | null {
    if (this.pointers.size < 2) return null;
    let sx = 0;
    let sy = 0;
    for (const p of this.pointers.values()) {
      sx += p.x;
      sy += p.y;
    }
    const n = this.pointers.size;
    return { x: sx / n, y: sy / n };
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
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.pointers.size === 1) {
          this.dragging = { side, pointerId: e.pointerId };
          el.setPointerCapture(e.pointerId);
        } else {
          this.dragging = null;
          this.twoFingerLast = this.midpoint();
        }
      });
    }

    this.root.addEventListener(
      'pointerdown',
      (e: PointerEvent) => {
        if (!this.enabled) return;
        const t = e.target as HTMLElement | null;
        if (t?.classList.contains('demo-handle')) return;
        // Only capture stage gestures — ignore HUD / buttons
        if (t && t !== this.root && !t.closest('#overlay')) {
          const tag = t.tagName;
          if (
            tag === 'BUTTON' ||
            tag === 'INPUT' ||
            tag === 'LABEL' ||
            t.closest('#hud') ||
            t.closest('#about-panel') ||
            t.closest('#btn-about')
          ) {
            return;
          }
        }
        e.preventDefault();
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.pointers.size >= 2) {
          this.dragging = null;
          this.twoFingerLast = this.midpoint();
        }
      },
      { passive: false },
    );

    window.addEventListener(
      'pointermove',
      (e: PointerEvent) => {
        if (!this.enabled) return;
        if (!this.pointers.has(e.pointerId)) return;
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (this.pointers.size >= 2) {
          e.preventDefault();
          const mid = this.midpoint();
          if (!mid || !this.twoFingerLast) {
            this.twoFingerLast = mid;
            return;
          }
          const rect = this.root.getBoundingClientRect();
          const dx = mid.x - this.twoFingerLast.x;
          const dy = mid.y - this.twoFingerLast.y;
          this.twoFingerLast = mid;
          // Vertical → open (same range as wheel: 0.03–0.35)
          this.pinch.open = Math.min(
            0.35,
            Math.max(0.03, this.pinch.open + (-dy / Math.max(rect.height, 1)) * 0.4),
          );
          // Horizontal → spread (same range as shift+wheel: 0.15–1.2)
          this.pinch.spread = Math.min(
            1.2,
            Math.max(0.15, this.pinch.spread + (dx / Math.max(rect.width, 1)) * 1.0),
          );
          return;
        }

        if (this.dragging && this.dragging.pointerId === e.pointerId) {
          const rect = this.root.getBoundingClientRect();
          const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
          const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
          this.pinch[this.dragging.side] = { x, y };
          this.syncHandles();
        }
      },
      { passive: false },
    );

    const endPointer = (e: PointerEvent) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.delete(e.pointerId);
      if (this.dragging?.pointerId === e.pointerId) {
        this.dragging = null;
      }
      if (this.pointers.size < 2) {
        this.twoFingerLast = null;
      } else {
        this.twoFingerLast = this.midpoint();
      }
    };
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);

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
    if (!on) {
      this.dragging = null;
      this.pointers.clear();
      this.twoFingerLast = null;
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
