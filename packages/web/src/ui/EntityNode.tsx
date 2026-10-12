import { AppWindow, Boxes, Container, Database, List, Plug, type LucideIcon } from 'lucide-react';
import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type MouseEventHandler,
  type ReactNode,
  type Ref,
} from 'react';
import { cx } from './cx';
import { joinIds } from './ids';
import type { Point } from './diagramLayout';
import { ICON_SIZE } from './icon';
import type { IconComponent } from './iconTypes';
import { hasSlot } from './slot';
import styles from './EntityNode.module.css';
import a11y from './visuallyHidden.module.css';

export type EntityKind =
  'gateway' | 'service' | 'integration' | 'datastore' | 'queue' | 'deployment';

/** Icon per entity kind (Figma uses lucide `app-window`, `boxes`, `plug`, `database`, `list`). */
export const ENTITY_KIND_ICONS: Record<EntityKind, LucideIcon> = {
  gateway: AppWindow,
  service: Boxes,
  integration: Plug,
  datastore: Database,
  queue: List,
  deployment: Container,
};

/**
 * - `default`: grey 1px border.
 * - `focus`: the scanned repository; 1.5px teal border and teal name.
 * - `added` (diff): as `focus`, name prefixed "+ ".
 * - `removed` (diff): dashed grey border, struck-through muted name.
 */
export type EntityNodeVariant = 'default' | 'focus' | 'added' | 'removed';

interface EntityNodeBaseProps extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'onClick' | 'role'
> {
  /** Entity name, e.g. "checkout-api". */
  name: string;
  /** Default `default`. */
  variant?: EntityNodeVariant;
  /**
   * Top-left in the `DiagramCanvas` stage (e.g. from `diagramGrid().cell()`). Positions the node
   * absolutely; omit to lay it out in normal flow (e.g. a compact A/B chain).
   */
  at?: Point;
  /** Makes the node a `<button>` (e.g. opens the entity's evidence). */
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

/** Architecture map node, 166×66 (Figma 3:13334). */
export interface RegularEntityNodeProps extends EntityNodeBaseProps {
  compact?: false;
  /** Picks the 13px heading icon. */
  kind: EntityKind;
  /** Overrides the kind's icon. */
  icon?: IconComponent;
  /** Muted line under the name, e.g. "TypeScript · NestJS". */
  subtitle?: ReactNode;
}

/** History A/B boundary entity: 90px wide, a single centred label (Figma 3:14339). */
export interface CompactEntityNodeProps extends EntityNodeBaseProps {
  compact: true;
  kind?: never;
  icon?: never;
  subtitle?: never;
}

export type EntityNodeProps = RegularEntityNodeProps | CompactEntityNodeProps;

const STATE_TEXT: Partial<Record<EntityNodeVariant, string>> = {
  added: ' (added)',
  removed: ' (removed)',
};

/**
 * An entity in an architecture diagram.
 *
 * With `onClick` it is a `<button type="button">` (opens the entity / its evidence): keyboard
 * focusable, global focus ring, pointer cursor and hover fill. Without it, a non-interactive
 * `<div role="group">` with the same look and labelling.
 *
 * Either way its accessible name is the visible name plus "(added)" / "(removed)" for diff
 * variants (the "+ " prefix and the strike-through are visual only), and the subtitle is its
 * description. Pass `aria-label` or `aria-labelledby` for anything more specific.
 */
export const EntityNode = forwardRef<HTMLElement, EntityNodeProps>(function EntityNode(
  {
    name,
    variant = 'default',
    compact = false,
    kind,
    icon,
    subtitle,
    at,
    onClick,
    className,
    style,
    'aria-describedby': describedBy,
    'aria-labelledby': labelledBy,
    ...rest
  },
  ref,
) {
  const nameId = useId();
  const subtitleId = useId();
  const showSubtitle = !compact && hasSlot(subtitle);
  const Icon = icon ?? (kind ? ENTITY_KIND_ICONS[kind] : undefined);
  const stateText = STATE_TEXT[variant];
  const interactive = onClick !== undefined;
  const label = (
    <>
      {variant === 'added' && <span aria-hidden>+ </span>}
      <span className={styles.nameText}>{name}</span>
      {stateText && <span className={a11y.visuallyHidden}>{stateText}</span>}
    </>
  );
  const content = compact ? (
    <span id={nameId} className={styles.compactName} title={name}>
      {label}
    </span>
  ) : (
    <>
      <span className={styles.heading}>
        {Icon && <Icon size={ICON_SIZE.entity} aria-hidden className={styles.icon} />}
        <span id={nameId} className={styles.name} title={name}>
          {label}
        </span>
      </span>
      {showSubtitle && (
        <span id={subtitleId} className={styles.subtitle}>
          {subtitle}
        </span>
      )}
    </>
  );
  const shared = {
    ...rest,
    className: cx(
      styles.node,
      compact ? styles.compact : styles.regular,
      styles[variant],
      interactive && styles.interactive,
      at && styles.placed,
      className,
    ),
    style: at ? { left: at.x, top: at.y, ...style } : style,
    // Name from the name span only, so the subtitle is the description, not part of the name.
    'aria-labelledby': labelledBy ?? (rest['aria-label'] ? undefined : nameId),
    'aria-describedby': joinIds(showSubtitle && subtitleId, describedBy),
    'data-variant': variant,
  };
  return interactive ? (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      {...(shared as ComponentPropsWithoutRef<'button'>)}
    >
      {content}
    </button>
  ) : (
    <div ref={ref as Ref<HTMLDivElement>} role="group" {...shared}>
      {content}
    </div>
  );
});
