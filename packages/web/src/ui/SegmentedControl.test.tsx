import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { SegmentedControl } from './SegmentedControl';

const OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'cron', label: 'Custom cron', disabled: true },
] as const;

function Demo() {
  const [value, setValue] = useState<string>('daily');
  return (
    <SegmentedControl
      name="frequency"
      aria-label="Frequency"
      options={OPTIONS}
      value={value}
      onValueChange={setValue}
    />
  );
}

describe('SegmentedControl', () => {
  it('is a named radio group reflecting the value', () => {
    render(<Demo />);
    expect(screen.getByRole('radiogroup', { name: 'Frequency' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Daily' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Custom cron' })).toBeDisabled();
  });

  it('selects by click and by arrow keys', async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.click(screen.getByText('Weekly'));
    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeChecked();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Monthly' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Monthly' })).toHaveFocus();
  });
});
