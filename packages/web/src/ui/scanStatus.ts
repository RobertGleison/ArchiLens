import { Check, CircleAlert, Clock } from 'lucide-react';
import type { IconComponent } from './iconTypes';
import { Spinner } from './Spinner';
import type { StatusPillTone } from './StatusPill';

/** Scan lifecycle states shown as pills across the app. */
export const SCAN_STATUSES = [
  'up_to_date',
  'running',
  'queued',
  'failed',
  'needs_attention',
] as const;

export type ScanStatus = (typeof SCAN_STATUSES)[number];

export interface ScanStatusPill {
  tone: StatusPillTone;
  icon: IconComponent;
  label: string;
}

const PILLS: Record<ScanStatus, ScanStatusPill> = {
  up_to_date: { tone: 'accent', icon: Check, label: 'Up to date' },
  running: { tone: 'accent', icon: Spinner, label: 'Running' },
  queued: { tone: 'neutral', icon: Clock, label: 'Queued' },
  // Deliberately monochrome: no danger colour in the design.
  failed: { tone: 'neutral', icon: CircleAlert, label: 'Failed' },
  needs_attention: { tone: 'neutral', icon: CircleAlert, label: 'Needs attention' },
};

/**
 * Pill tone, icon and label for a scan state, so every screen shows scan statuses the same way:
 *
 * ```tsx
 * const { label, ...pill } = scanStatusToPill(status);
 * <StatusPill {...pill}>{label}</StatusPill>
 * ```
 */
export function scanStatusToPill(status: ScanStatus): ScanStatusPill {
  return PILLS[status];
}
