import {
  forwardRef,
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { cx } from './cx';
import { hasSlot } from './slot';
import styles from './Switch.module.css';

export interface SwitchProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'type' | 'role' | 'value' | 'defaultValue' | 'onChange'
> {
  /** Controlled state. */
  checked?: boolean;
  /** Initial state when uncontrolled. */
  defaultChecked?: boolean;
  /** Called with the new state when the user toggles the switch. */
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * On/off switch (Figma 3:13172 / 3:14554): track 30x18, radius 20, padding 3, a white 12px thumb.
 * On: accent track, thumb right. Off (derived): border-grey track, thumb left. A
 * `<button role="switch" aria-checked>`, so Space and Enter toggle it; name it with `aria-label`,
 * `aria-labelledby` or a `<label htmlFor>` (see `PreferenceRow`). Works controlled (`checked` +
 * `onCheckedChange`) or uncontrolled (`defaultChecked`).
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, defaultChecked = false, onCheckedChange, onClick, className, ...rest },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState(defaultChecked);
  const on = checked ?? uncontrolled;
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (checked === undefined) setUncontrolled(!on);
    onCheckedChange?.(!on);
  };
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={on}
      {...rest}
      onClick={handleClick}
      className={cx(styles.switch, className)}
    >
      <span className={styles.thumb} aria-hidden />
    </button>
  );
});

export interface PreferenceRowProps extends Omit<SwitchProps, 'title' | 'children'> {
  /** Preference name (Inter 500 13px ink); labels the switch. */
  title: ReactNode;
  /** Explanation under the title (11px muted); describes the switch. */
  description?: ReactNode;
  /** Classes for the row (the ref and other props go on the switch). */
  className?: string;
}

/**
 * Preference row (Figma 3:13168 / 3:14550): title + description on the left (gap 3), switch on
 * the right, gap 18. The title is the switch's `<label>`, so clicking it toggles the switch too.
 */
export const PreferenceRow = forwardRef<HTMLButtonElement, PreferenceRowProps>(
  function PreferenceRow({ title, description, className, id, ...switchProps }, ref) {
    const uid = useId();
    const switchId = id ?? `${uid}-switch`;
    const descriptionId = hasSlot(description) ? `${uid}-description` : undefined;
    return (
      <div className={cx(styles.row, className)}>
        <div className={styles.text}>
          <label htmlFor={switchId} className={styles.title}>
            {title}
          </label>
          {descriptionId && (
            <span id={descriptionId} className={styles.description}>
              {description}
            </span>
          )}
        </div>
        <Switch ref={ref} id={switchId} aria-describedby={descriptionId} {...switchProps} />
      </div>
    );
  },
);
