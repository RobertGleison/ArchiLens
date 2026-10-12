import type { ReactNode } from 'react';

/** True when an optional slot has something to render (so `0` is rendered, not dropped). */
export function hasSlot(node: ReactNode): boolean {
  return node != null && node !== false && node !== true;
}
