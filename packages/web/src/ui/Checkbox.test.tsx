import { fireEvent, render, screen } from '@testing-library/react';
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

  it('can be disabled', () => {
    render(<Checkbox aria-label="Monitored" disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });
});
