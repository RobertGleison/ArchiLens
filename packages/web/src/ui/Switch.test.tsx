import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PreferenceRow, Switch } from './Switch';

describe('Switch', () => {
  it('is a switch that toggles uncontrolled with click, Space and Enter', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Poll" onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole('switch', { name: 'Poll' });
    expect(toggle).not.toBeChecked();
    await user.click(toggle);
    expect(toggle).toBeChecked();
    await user.keyboard(' ');
    expect(toggle).not.toBeChecked();
    await user.keyboard('{Enter}');
    expect(toggle).toBeChecked();
    expect(onCheckedChange.mock.calls).toEqual([[true], [false], [true]]);
  });

  it('follows the checked prop when controlled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Skip" checked onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole('switch'));
    expect(onCheckedChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Off" disabled onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole('switch'));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});

describe('PreferenceRow', () => {
  it('labels and describes the switch; clicking the title toggles it', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLButtonElement>();
    function Demo() {
      const [on, setOn] = useState(true);
      return (
        <PreferenceRow
          ref={ref}
          title="Skip unchanged runs"
          description="No new commits → no model call, no analysis spend."
          checked={on}
          onCheckedChange={setOn}
        />
      );
    }
    render(<Demo />);
    const toggle = screen.getByRole('switch', { name: 'Skip unchanged runs' });
    expect(ref.current).toBe(toggle);
    expect(toggle).toHaveAccessibleDescription(
      'No new commits → no model call, no analysis spend.',
    );
    expect(toggle).toBeChecked();
    await user.click(screen.getByText('Skip unchanged runs'));
    expect(toggle).not.toBeChecked();
  });
});
