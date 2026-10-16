import { render, screen } from '@testing-library/react';
import { FolderGit2 } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders a 28px decorative icon, a paragraph title, description and action', () => {
    const { container } = render(
      <EmptyState
        className="x"
        icon={FolderGit2}
        title="No repositories monitored yet"
        description="Add repositories to start."
        action={<Button variant="primary">Add repositories</Button>}
      />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveClass('x');
    expect(root).not.toHaveAttribute('role');
    const icon = container.querySelector('svg');
    expect(icon).toHaveAttribute('width', '28');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('No repositories monitored yet').tagName).toBe('P');
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByRole('button', { name: 'Add repositories' })).toBeInTheDocument();
  });

  it('renders the title as a heading when given a level', () => {
    render(<EmptyState icon={FolderGit2} headingLevel={1} title="Page not found" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  });

  it('has a compact single-line variant', () => {
    render(<EmptyState variant="compact">No architectural changes this week</EmptyState>);
    const line = screen.getByText('No architectural changes this week');
    expect(line.tagName).toBe('P');
    expect(line.querySelector('svg')).toBeNull();
  });
});
