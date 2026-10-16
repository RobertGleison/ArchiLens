import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnchorList } from './AnchorList';
import { AttributeList, AttributeListItem } from './AttributeList';
import { Divider } from './Divider';

describe('AttributeList', () => {
  it('renders label / value pairs as a <dl>', () => {
    render(
      <AttributeList className="x">
        <AttributeListItem label="Application stack">Node.js 22</AttributeListItem>
        <AttributeListItem label="Data stores">PostgreSQL 16</AttributeListItem>
      </AttributeList>,
    );
    const terms = screen.getAllByRole('term');
    expect(terms.map((t) => t.textContent)).toEqual(['Application stack', 'Data stores']);
    expect(screen.getAllByRole('definition').map((d) => d.textContent)).toEqual([
      'Node.js 22',
      'PostgreSQL 16',
    ]);
    expect(terms[0]?.closest('dl')).toHaveClass('x');
    expect(terms[0]?.closest('dl')).toHaveAttribute('data-density', 'default');
  });

  it('supports the compact density', () => {
    render(
      <AttributeList density="compact">
        <AttributeListItem label="Data stores">PostgreSQL 16</AttributeListItem>
      </AttributeList>,
    );
    expect(screen.getByRole('term').closest('dl')).toHaveAttribute('data-density', 'compact');
  });
});

describe('Divider', () => {
  it('is a separator', () => {
    render(<Divider className="x" />);
    expect(screen.getByRole('separator')).toHaveClass('x');
  });
});

describe('AnchorList', () => {
  it('is a named navigation marking the active anchor', () => {
    render(
      <AnchorList
        aria-label="In this report"
        activeHref="#summary"
        items={[
          { href: '#summary', label: 'Executive summary' },
          { href: '#diff', label: 'Architecture visual diff' },
        ]}
      />,
    );
    expect(screen.getByRole('navigation', { name: 'In this report' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Executive summary' })).toHaveAttribute(
      'aria-current',
      'location',
    );
    expect(screen.getByRole('link', { name: 'Architecture visual diff' })).not.toHaveAttribute(
      'aria-current',
    );
  });
});
