import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EntityNode } from './EntityNode';
import styles from './EntityNode.module.css';

describe('EntityNode', () => {
  it('with onClick: a focusable button named by the entity, described by its subtitle', async () => {
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
    expect(node).toHaveClass(
      styles.node!,
      styles.regular!,
      styles.focus!,
      styles.interactive!,
      'x',
    );
    expect(node).toHaveAttribute('data-variant', 'focus');
    expect(node.querySelector('svg')).toHaveAttribute('width', '13');
    expect(node.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');

    await userEvent.tab();
    expect(node).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('without onClick: a non-interactive group with the same name and description', async () => {
    render(<EntityNode name="Stripe" kind="integration" subtitle="Payments integration" />);
    expect(screen.queryByRole('button')).toBeNull();
    const node = screen.getByRole('group', { name: 'Stripe' });
    expect(node.tagName).toBe('DIV');
    expect(node).toHaveAccessibleDescription('Payments integration');
    expect(node).toHaveClass(styles.node!, styles.regular!);
    expect(node).not.toHaveClass(styles.interactive!);
    expect(node).not.toHaveAttribute('tabindex');

    await userEvent.tab();
    expect(node).not.toHaveFocus();
  });

  it('marks added and removed entities in the name, not only visually', () => {
    render(
      <>
        <EntityNode name="Redis cache" kind="datastore" variant="added" />
        <EntityNode name="payments" kind="service" variant="removed" />
      </>,
    );
    const added = screen.getByRole('group', { name: 'Redis cache (added)' });
    expect(added).toHaveTextContent('+ Redis cache');
    expect(added).toHaveClass(styles.added!);
    const removed = screen.getByRole('group', { name: 'payments (removed)' });
    expect(removed).toHaveClass(styles.removed!);
    expect(removed.querySelector(`.${styles.nameText}`)).toHaveTextContent('payments');
  });

  it('positions absolutely when given a stage point', () => {
    render(<EntityNode name="Stripe" kind="integration" at={{ x: 536, y: 54 }} />);
    const node = screen.getByRole('group', { name: 'Stripe' });
    expect(node).toHaveClass(styles.placed!);
    expect(node).toHaveStyle({ left: '536px', top: '54px' });
  });

  it('has a compact variant with a single label and no icon', () => {
    render(<EntityNode compact name="SQS" variant="added" onClick={() => {}} />);
    const node = screen.getByRole('button', { name: 'SQS (added)' });
    expect(node).toHaveClass(styles.compact!);
    expect(node.querySelector('svg')).toBeNull();
    expect(node).not.toHaveAttribute('aria-describedby');
  });

  it('uses an explicit aria-label instead of the name span', () => {
    render(<EntityNode name="checkout-api" kind="service" aria-label="checkout-api, scanned" />);
    expect(screen.getByRole('group', { name: 'checkout-api, scanned' })).not.toHaveAttribute(
      'aria-labelledby',
    );
  });

  it('uses an explicit aria-labelledby and keeps extra descriptions', () => {
    render(
      <>
        <span id="ext-name">Checkout service</span>
        <span id="ext-desc">Scanned repository</span>
        <EntityNode
          name="checkout-api"
          kind="service"
          subtitle="TypeScript · NestJS"
          aria-labelledby="ext-name"
          aria-describedby="ext-desc"
          onClick={() => {}}
        />
      </>,
    );
    const node = screen.getByRole('button', { name: 'Checkout service' });
    expect(node).toHaveAccessibleDescription('TypeScript · NestJS Scanned repository');
  });
});
