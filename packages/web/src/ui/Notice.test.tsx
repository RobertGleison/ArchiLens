import { render, screen } from '@testing-library/react';
import { ShieldCheck } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { Notice } from './Notice';

describe('Notice', () => {
  it('is a note with a decorative 18px icon by default', () => {
    render(<Notice className="x">Read-only access</Notice>);
    const note = screen.getByRole('note');
    expect(note).toHaveTextContent('Read-only access');
    expect(note).toHaveClass('x');
    const icon = note.querySelector('svg');
    expect(icon).toHaveAttribute('width', '18');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('is a polite status when live, with a custom icon', () => {
    render(
      <Notice icon={ShieldCheck} live>
        Connected
      </Notice>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Connected');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
