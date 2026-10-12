import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EntityNode } from './EntityNode';
import styles from './EntityNode.module.css';

describe('EntityNode', () => {
  it('is a focusable button named by the entity, described by its subtitle', async () => {
    const onClick = vi.fn();
    render(
      <EntityNode
        name="checkout-api"
        kind="service"
        subtitle="TypeScript · NestJS"
        variant="focus"
        onClick={onClick}
        className="x"
      />,
    );
    const node = screen.getByRole('button', { name: 'checkout-api' });
    expect(node).toHaveAccessibleDescription('TypeScript · NestJS');
    expect(node).toHaveAttribute('type', 'button');
    expect(node).toHaveClass(styles.node!, styles.regular!, styles.focus!, 'x');
    expect(node).toHaveAttribute('data-variant', 'focus');
    expect(node.querySelector('svg')).toHaveAttribute('width', '13');
    expect(node.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');

    await userEvent.tab();
    expect(node).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('marks added and removed entities in the name, not only visually', () => {
    render(
      <>
        <EntityNode name="Redis cache" kind="datastore" variant="added" />
        <EntityNode name="payments" kind="service" variant="removed" />
      </>,
    );
    const added = screen.getByRole('button', { name: 'Redis cache (added)' });
    expect(added).toHaveTextContent('+ Redis cache');
    expect(added).toHaveClass(styles.added!);
    const removed = screen.getByRole('button', { name: 'payments (removed)' });
    expect(removed).toHaveClass(styles.removed!);
    expect(removed.querySelector(`.${styles.nameText}`)).toHaveTextContent('payments');
  });

  it('positions absolutely when given a stage point', () => {
    render(<EntityNode name="Stripe" kind="integration" at={{ x: 536, y: 41 }} />);
    const node = screen.getByRole('button', { name: 'Stripe' });
    expect(node).toHaveClass(styles.placed!);
    expect(node).toHaveStyle({ left: '536px', top: '41px' });
  });

  it('has a compact variant with a single label and no icon', () => {
    render(<EntityNode compact name="SQS" variant="added" />);
    const node = screen.getByRole('button', { name: 'SQS (added)' });
    expect(node).toHaveClass(styles.compact!);
    expect(node.querySelector('svg')).toBeNull();
    expect(node).not.toHaveAttribute('aria-describedby');
  });

  it('uses an explicit aria-label instead of the name span', () => {
    render(<EntityNode name="checkout-api" kind="service" aria-label="checkout-api, scanned" />);
    expect(screen.getByRole('button', { name: 'checkout-api, scanned' })).not.toHaveAttribute(
      'aria-labelledby',
    );
  });
});
