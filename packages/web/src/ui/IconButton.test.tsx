import { fireEvent, render, screen } from '@testing-library/react';
import { Bell } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is a button named by its label with an 18px decorative icon', () => {
    const onClick = vi.fn();
    render(<IconButton icon={Bell} label="Notifications" onClick={onClick} className="x" />);
    const button = screen.getByRole('button', { name: 'Notifications' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('x');
    const icon = button.querySelector('svg');
    expect(icon).toHaveAttribute('width', '18');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn();
    render(<IconButton icon={Bell} label="Notifications" disabled onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('requires a label', () => {
    // @ts-expect-error `label` is required: icon-only buttons need an accessible name.
    const missing = <IconButton icon={Bell} />;
    expect(missing).toBeTruthy();

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<IconButton icon={Bell} label="  " />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('accessible name'));
  });
});
