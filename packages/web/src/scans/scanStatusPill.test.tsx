import type { RepoScanState } from '@archilens/shared';
import { render, screen } from '@testing-library/react';
import { Ban, Check, CircleAlert, Clock } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { Spinner } from '../ui/Spinner';
import { StatusPill } from '../ui/StatusPill';
import { SCAN_STATUS_PILLS, scanStatusToPill } from './scanStatusPill';

describe('scanStatusToPill', () => {
  it.each([
    ['up_to_date', 'accent', Check, 'Up to date'],
    ['running', 'accent', Spinner, 'Running'],
    ['queued', 'neutral', Clock, 'Queued'],
    ['failed', 'neutral', CircleAlert, 'Failed'],
    ['needs_attention', 'neutral', CircleAlert, 'Needs attention'],
    ['cancelled', 'neutral', Ban, 'Cancelled'],
  ] as const)('maps %s to a %s pill', (state, tone, icon, label) => {
    expect(scanStatusToPill(state)).toEqual({ tone, icon, label });
  });

  it('gives every state a non-empty label and an icon', () => {
    for (const state of Object.keys(SCAN_STATUS_PILLS) as RepoScanState[]) {
      const pill = scanStatusToPill(state);
      expect(pill.label.trim()).not.toBe('');
      expect(pill.icon).toBeTruthy();
    }
  });

  it('renders the running state with a spinning loader', () => {
    const { label, ...pill } = scanStatusToPill('running');
    render(<StatusPill {...pill}>{label}</StatusPill>);
    expect(screen.getByText('Running').querySelector('[data-spinner]')).not.toBeNull();
  });
});
