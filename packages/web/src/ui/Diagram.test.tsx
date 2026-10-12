import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DiagramCanvas, DiagramLegend, describeRelationship } from './Diagram';
import styles from './Diagram.module.css';
import { Edge } from './Edge';
import { EntityNode } from './EntityNode';

describe('DiagramCanvas', () => {
  it('is a figure captioned by the boundary, with a sized stage and footer lines', () => {
    const { container } = render(
      <DiagramCanvas
        width={702}
        height={252}
        boundary="Checkout service / production"
        hosting="DEPLOYMENT · AWS ECS Fargate"
        note="Teal: added relationship or component"
        className="x"
      >
        <Edge
          points={[
            { x: 166, y: 87 },
            { x: 268, y: 87 },
          ]}
        />
        <EntityNode name="API gateway" kind="gateway" at={{ x: 0, y: 54 }} />
      </DiagramCanvas>,
    );
    const figure = screen.getByRole('figure', { name: 'Checkout service / production' });
    expect(figure).toHaveClass(styles.canvas!, 'x');
    expect(container.querySelector(`.${styles.stage}`)).toHaveStyle({
      width: '702px',
      height: '252px',
    });
    expect(screen.getByText('DEPLOYMENT · AWS ECS Fargate')).toHaveClass(styles.hosting!);
    expect(screen.getByText('Teal: added relationship or component')).toHaveClass(styles.note!);
    expect(within(figure).getByRole('button', { name: 'API gateway' })).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('lists relationships as text', () => {
    render(
      <DiagramCanvas
        width={10}
        height={10}
        relationships={[
          { from: 'API gateway', to: 'checkout-api', protocol: 'HTTPS' },
          { from: 'checkout-api', to: 'Redis cache', change: 'added' },
        ]}
      >
        {null}
      </DiagramCanvas>,
    );
    const list = screen.getByRole('list', { name: 'Relationships' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['API gateway to checkout-api, HTTPS', 'checkout-api to Redis cache, added']);
  });

  it('describeRelationship joins the parts', () => {
    expect(describeRelationship({ from: 'a', to: 'b' })).toBe('a to b');
  });
});

describe('DiagramLegend', () => {
  it('renders summary chips as a list with an optional action', () => {
    render(
      <DiagramLegend
        items={[{ label: '6 entities' }, { label: '23 evidence links', tone: 'accent' }]}
        action={<button type="button">Expand diagram</button>}
      />,
    );
    const list = screen.getByRole('list', { name: 'Diagram summary' });
    const chips = within(list).getAllByRole('listitem');
    expect(chips).toHaveLength(2);
    expect(within(chips[1]!).getByText('23 evidence links')).toHaveAttribute('data-tone', 'accent');
    expect(within(chips[0]!).getByText('6 entities')).toHaveAttribute('data-tone', 'neutral');
    expect(screen.getByRole('button', { name: 'Expand diagram' }).parentElement).toHaveClass(
      styles.action!,
    );
  });
});
