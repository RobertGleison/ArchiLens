import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Layers } from 'lucide-react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OptionCard, OptionCardGroup, PreviewTile } from './OptionCard';
import { StatusPill } from './StatusPill';

function ScanModes({ onChange }: { onChange?: (v: string) => void }) {
  const [value, setValue] = useState<string | null>('incremental');
  return (
    <OptionCardGroup
      name="mode"
      aria-label="Scan mode"
      value={value}
      onValueChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    >
      <OptionCard
        value="baseline"
        icon={Layers}
        title="Baseline"
        description="Rebuild the current architecture"
        meta="Estimated $3.60"
        showSelectedPill
      />
      <OptionCard value="incremental" title="Incremental" showSelectedPill />
      <OptionCard value="backfill" title="Historical backfill" disabled />
    </OptionCardGroup>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OptionCardGroup (radio)', () => {
  it('moves the selection with the arrow keys, skipping disabled cards', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ScanModes onChange={onChange} />);
    const incremental = screen.getByRole('radio', { name: 'Incremental' });
    await user.tab();
    expect(incremental).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    const baseline = screen.getByRole('radio', { name: 'Baseline' });
    expect(baseline).toHaveFocus();
    expect(baseline).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith('baseline');

    await user.keyboard('{ArrowRight}');
    expect(incremental).toHaveFocus();
    expect(incremental).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith('incremental');
  });

  it('is a named radiogroup of native radios named by their titles', () => {
    render(<ScanModes />);
    expect(screen.getByRole('radiogroup', { name: 'Scan mode' })).toBeInTheDocument();
    const baseline = screen.getByRole('radio', { name: 'Baseline' });
    expect(baseline).toHaveAccessibleDescription(
      'Rebuild the current architecture Estimated $3.60',
    );
    expect(baseline).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Incremental' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Historical backfill' })).toBeDisabled();
    for (const radio of screen.getAllByRole('radio')) expect(radio).toHaveAttribute('name', 'mode');
  });

  it('selects on click anywhere on the card and shows the Selected pill', () => {
    const onChange = vi.fn();
    render(<ScanModes onChange={onChange} />);
    fireEvent.click(screen.getByText('Rebuild the current architecture'));
    expect(onChange).toHaveBeenCalledWith('baseline');
    const baseline = screen.getByRole('radio', { name: 'Baseline' });
    expect(baseline).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Incremental' })).not.toBeChecked();
    const card = baseline.closest('label')!;
    expect(card).toHaveAttribute('data-checked', 'true');
    expect(card).toHaveTextContent('Selected');
    expect(screen.getAllByText('Selected')).toHaveLength(1);
    expect(card.querySelector('svg')).toHaveAttribute('width', '16');
  });

  it('does not select a disabled card', () => {
    const onChange = vi.fn();
    render(<ScanModes onChange={onChange} />);
    fireEvent.click(screen.getByText('Historical backfill'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('throws outside a group', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<OptionCard value="x" title="X" />)).toThrow(/OptionCardGroup/);
  });
});

describe('OptionCardGroup (checkbox)', () => {
  function Orgs({ onChange }: { onChange: (v: string[]) => void }) {
    const [value, setValue] = useState<string[]>(['meridian']);
    return (
      <OptionCardGroup
        type="checkbox"
        name="orgs"
        aria-label="Organizations"
        value={value}
        onValueChange={(v) => {
          setValue(v);
          onChange(v);
        }}
      >
        <OptionCard
          layout="row"
          value="meridian"
          title="meridian"
          description="18 repositories available"
          trailing={<StatusPill tone="accent">Approved</StatusPill>}
        />
        <OptionCard layout="row" value="cloud" title="meridian-cloud" />
      </OptionCardGroup>
    );
  }

  it('toggles values in a named group of checkboxes', () => {
    const onChange = vi.fn();
    render(<Orgs onChange={onChange} />);
    expect(screen.getByRole('group', { name: 'Organizations' })).toBeInTheDocument();
    const meridian = screen.getByRole('checkbox', { name: 'meridian' });
    expect(meridian).toBeChecked();
    expect(meridian).toHaveAccessibleDescription('18 repositories available Approved');
    fireEvent.click(screen.getByRole('checkbox', { name: 'meridian-cloud' }));
    expect(onChange).toHaveBeenLastCalledWith(['meridian', 'cloud']);
    fireEvent.click(meridian);
    expect(onChange).toHaveBeenLastCalledWith(['cloud']);
  });
});

describe('PreviewTile', () => {
  it('renders title, meta and a decorative 16px icon', () => {
    render(<PreviewTile icon={Layers} title="checkout-api" meta="TypeScript · 42 modules" />);
    const tile = screen.getByText('checkout-api').parentElement!;
    expect(tile).toHaveTextContent('TypeScript · 42 modules');
    expect(tile.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
