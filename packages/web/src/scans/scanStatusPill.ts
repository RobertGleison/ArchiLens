import type { RepoScanState } from '@archilens/shared';
import { Ban, Check, CircleAlert, Clock } from 'lucide-react';
import type { IconComponent } from '../ui/iconTypes';
import { Spinner } from '../ui/Spinner';
import type { StatusPillTone } from '../ui/StatusPill';

export interface ScanStatusPill {
  tone: StatusPillTone;
  icon: IconComponent;
  label: string;
}

/**
 * Pill per repository scan state. Only active / healthy states use the accent tone; problems are
 * deliberately monochrome (neutral + circle-alert), as there is no danger colour in the design.
 * `cancelled` is not drawn in Figma: neutral with `ban`, so it reads as stopped, not failed.
 */
export const SCAN_STATUS_PILLS: Readonly<Record<RepoScanState, ScanStatusPill>> = {
  up_to_date: { tone: 'accent', icon: Check, label: 'Up to date' },
  running: { tone: 'accent', icon: Spinner, label: 'Running' },
  queued: { tone: 'neutral', icon: Clock, label: 'Queued' },
  failed: { tone: 'neutral', icon: CircleAlert, label: 'Failed' },
  needs_attention: { tone: 'neutral', icon: CircleAlert, label: 'Needs attention' },
  cancelled: { tone: 'neutral', icon: Ban, label: 'Cancelled' },
};

/**
 * Pill tone, icon and label for a repository scan state, so every screen shows scan statuses the
 * same way:
 *
 * ```tsx
 * const { label, ...pill } = scanStatusToPill(state);
 * <StatusPill {...pill}>{label}</StatusPill>
 * ```
 */
export function scanStatusToPill(state: RepoScanState): ScanStatusPill {
  return SCAN_STATUS_PILLS[state];
}
