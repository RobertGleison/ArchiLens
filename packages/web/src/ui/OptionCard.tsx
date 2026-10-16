import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { cx } from './cx';
import { hasSlot } from './slot';
import { ICON_SIZE } from './icon';
import { joinIds } from './ids';
import type { IconComponent } from './iconTypes';
import { StatusPill } from './StatusPill';
import styles from './OptionCard.module.css';
import a11y from './visuallyHidden.module.css';

interface GroupContextValue {
  type: 'radio' | 'checkbox';
  name: string;
  isChecked: (value: string) => boolean;
  toggle: (value: string, checked: boolean) => void;
  disabled: boolean;
}

const GroupContext = createContext<GroupContextValue | null>(null);

/** The group must be named: by `aria-label` or by pointing `aria-labelledby` at a visible heading. */
type GroupNameProps =
  | { 'aria-label': string; 'aria-labelledby'?: never }
  | { 'aria-label'?: never; 'aria-labelledby': string };

interface GroupBaseProps extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'onChange' | 'defaultValue' | 'aria-label' | 'aria-labelledby'
> {
  /** Shared `name` of the native inputs. */
  name: string;
  /** Lay the cards out in a row (equal widths, 12px gap; the Figma layout) or a column. */
  orientation?: 'row' | 'column';
  disabled?: boolean;
  children: ReactNode;
}

/** Single choice: native radios, so arrow keys move the selection within the group. */
export interface RadioOptionCardGroupProps extends GroupBaseProps {
  type?: 'radio';
  value: string | null;
  onValueChange: (value: string) => void;
}

/** Multiple choice: native checkboxes (Space toggles, Tab moves between cards). */
export interface CheckboxOptionCardGroupProps extends GroupBaseProps {
  type: 'checkbox';
  value: readonly string[];
  onValueChange: (value: string[]) => void;
}

export type OptionCardGroupProps = (RadioOptionCardGroupProps | CheckboxOptionCardGroupProps) &
  GroupNameProps;

/**
 * A group of selectable option cards (scan modes 3:13418, organization sources 3:13008). Name it
 * with `aria-label` or `aria-labelledby`. Renders `role="radiogroup"` (or `group` for checkboxes)
 * around visually hidden native inputs, so keyboard and screen reader behaviour is the browser's.
 */
export const OptionCardGroup = forwardRef<HTMLDivElement, OptionCardGroupProps>(
  function OptionCardGroup(props, ref) {
    const {
      type = 'radio',
      name,
      value,
      onValueChange,
      orientation = 'row',
      disabled = false,
      className,
      children,
      ...rest
    } = props;

    const context: GroupContextValue =
      props.type === 'checkbox'
        ? {
            type: 'checkbox',
            name,
            disabled,
            isChecked: (v) => props.value.includes(v),
            toggle: (v, checked) =>
              props.onValueChange(
                checked
                  ? [...props.value.filter((x) => x !== v), v]
                  : props.value.filter((x) => x !== v),
              ),
          }
        : {
            type: 'radio',
            name,
            disabled,
            isChecked: (v) => value === v,
            toggle: (v, checked) => {
              if (checked) (onValueChange as RadioOptionCardGroupProps['onValueChange'])(v);
            },
          };

    return (
      <div
        ref={ref}
        role={type === 'radio' ? 'radiogroup' : 'group'}
        aria-disabled={disabled || undefined}
        {...rest}
        className={cx(styles.group, orientation === 'column' && styles.column, className)}
      >
        <GroupContext.Provider value={context}>{children}</GroupContext.Provider>
      </div>
    );
  },
);

export interface OptionCardProps extends Omit<
  ComponentPropsWithoutRef<'input'>,
  'type' | 'name' | 'value' | 'title' | 'checked'
> {
  /** Value reported to the group's `onValueChange`. */
  value: string;
  title: ReactNode;
  /**
   * `stacked` (default, scan mode 3:13419): icon + 13px title, 12px body, 11px muted meta; radius 6.
   * `row` (organization 3:13009): 12px semibold title + 11px muted line, `trailing` on the right;
   * radius 8.
   */
  layout?: 'stacked' | 'row';
  /** Leading 16px icon in the title row (stacked layout). */
  icon?: IconComponent;
  /** Body line (stacked: 12px ink; row: the 11px muted line under the title). */
  description?: ReactNode;
  /** Muted 11px line, e.g. "Estimated $0.42 · ~24k tokens" (stacked layout). */
  meta?: ReactNode;
  /** Right-side content in the row layout, e.g. a `StatusPill`. */
  trailing?: ReactNode;
  /** Show an accent "Selected" pill in the title row while checked (stacked layout). */
  showSelectedPill?: boolean;
  className?: string;
}

/**
 * Selectable option card. Must be inside an `OptionCardGroup`. The whole card is the input's
 * `<label>` (click anywhere to select); the title names the input (`aria-labelledby`) and the other
 * lines describe it (`aria-describedby`).
 */
export const OptionCard = forwardRef<HTMLInputElement, OptionCardProps>(function OptionCard(
  {
    value,
    title,
    layout = 'stacked',
    icon: Icon,
    description,
    meta,
    trailing,
    showSelectedPill = false,
    disabled,
    className,
    onChange,
    id,
    ...rest
  },
  ref,
) {
  const group = useContext(GroupContext);
  const uid = useId();
  if (!group) throw new Error('OptionCard must be rendered inside an OptionCardGroup');
  const checked = group.isChecked(value);
  const isDisabled = group.disabled || disabled === true;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    group.toggle(value, event.target.checked);
  };

  const titleId = `${uid}-title`;
  const showDescription = hasSlot(description);
  const showMeta = hasSlot(meta) && layout === 'stacked';
  const showTrailing = hasSlot(trailing) && layout === 'row';
  const descriptionId = showDescription ? `${uid}-description` : undefined;
  const metaId = showMeta ? `${uid}-meta` : undefined;
  const trailingId = showTrailing ? `${uid}-trailing` : undefined;
  const describedBy = joinIds(descriptionId, metaId, trailingId);

  const input = (
    <input
      ref={ref}
      id={id}
      aria-labelledby={titleId}
      aria-describedby={describedBy}
      {...rest}
      type={group.type}
      name={group.name}
      value={value}
      checked={checked}
      disabled={isDisabled}
      onChange={handleChange}
      className={cx(a11y.visuallyHidden, styles.input)}
    />
  );

  return (
    <label
      className={cx(styles.card, styles[layout], className)}
      data-checked={checked || undefined}
      data-disabled={isDisabled || undefined}
    >
      {input}
      {layout === 'row' ? (
        <>
          <span className={styles.identity}>
            <span id={titleId} className={styles.rowTitle}>
              {title}
            </span>
            {showDescription && (
              <span id={descriptionId} className={styles.rowDescription}>
                {description}
              </span>
            )}
          </span>
          {showTrailing && (
            <span id={trailingId} className={styles.trailing}>
              {trailing}
            </span>
          )}
        </>
      ) : (
        <>
          <span className={styles.titleRow}>
            {Icon && <Icon size={ICON_SIZE.card} aria-hidden className={styles.icon} />}
            <span id={titleId} className={styles.title}>
              {title}
            </span>
            {showSelectedPill && checked && (
              // The checked state is announced by the input; the pill is visual only.
              <StatusPill tone="accent" aria-hidden>
                Selected
              </StatusPill>
            )}
          </span>
          {showDescription && (
            <span id={descriptionId} className={styles.description}>
              {description}
            </span>
          )}
          {showMeta && (
            <span id={metaId} className={styles.meta}>
              {meta}
            </span>
          )}
        </>
      )}
    </label>
  );
});

export interface PreviewTileProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  title: ReactNode;
  /** Leading 16px icon, e.g. `FolderGit2`. */
  icon?: IconComponent;
  /** Muted 10px line, e.g. "TypeScript · 42 modules". */
  meta?: ReactNode;
}

/**
 * Small non-interactive preview tile (repository previews, 3:12791): subtle fill, no border,
 * radius 6, padding 12, gap 8. Wrap the title in a link to make it navigable.
 */
export const PreviewTile = forwardRef<HTMLDivElement, PreviewTileProps>(function PreviewTile(
  { title, icon: Icon, meta, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} {...rest} className={cx(styles.preview, className)}>
      {Icon && <Icon size={ICON_SIZE.card} aria-hidden className={styles.icon} />}
      <span className={styles.previewTitle}>{title}</span>
      {hasSlot(meta) && <span className={styles.previewMeta}>{meta}</span>}
    </div>
  );
});
