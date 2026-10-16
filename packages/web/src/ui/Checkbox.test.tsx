import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('is a native checkbox named by aria-label that forwards its ref', () => {
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    render(<Checkbox ref={ref} aria-label="Select inventory-api" onChange={onChange} />);
    const box = screen.getByRole('checkbox', { name: 'Select inventory-api' });
    expect(ref.current).toBe(box);
    fireEvent.click(box);
    expect(onChange).toHaveBeenCalled();
  });

  it('reflects the indeterminate prop on the input', () => {
    const { rerender } = render(<Checkbox aria-label="All" indeterminate readOnly />);
    expect(screen.getByRole('checkbox')).toHaveProperty('indeterminate', true);
    rerender(<Checkbox aria-label="All" readOnly />);
    expect(screen.getByRole('checkbox')).toHaveProperty('indeterminate', false);
  });

  it('stays indeterminate after a click when the prop does not change', async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="All" indeterminate checked={false} onChange={() => {}} />);
    const box = screen.getByRole('checkbox');
    await user.click(box);
    expect(box).toHaveProperty('indeterminate', true);
    expect(box).not.toBeChecked();
  });

  it('can be disabled', () => {
    render(<Checkbox aria-label="Monitored" disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });
});

describe('Checkbox with label', () => {
  it('is named by its visible label, toggles from the text and keeps className on the row', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox ref={ref} label="Push to monitored branches" className="row" />);
    const box = screen.getByRole('checkbox', { name: 'Push to monitored branches' });
    expect(ref.current).toBe(box);
    expect(box.closest('label')).toHaveClass('row');
    await user.click(screen.getByText('Push to monitored branches'));
    expect(box).toBeChecked();
  });
});
