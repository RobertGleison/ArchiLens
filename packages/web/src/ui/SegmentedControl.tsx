import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ForwardedRef,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { cx } from './cx';
import styles from './SegmentedControl.module.css';
import a11y from './visuallyHidden.module.css';

export interface SegmentedOption<V extends string = string> {
  value: V;
  label: ReactNode;
  disabled?: boolean;
}

/** The group must be named: by `aria-label` or by pointing `aria-labelledby` at a visible label. */
type GroupNameProps =
  | { 'aria-label': string; 'aria-labelledby'?: never }
  | { 'aria-label'?: never; 'aria-labelledby': string };

export type SegmentedControlProps<V extends string = string> = Omit<
  ComponentPropsWithoutRef<'div'>,
  'onChange' | 'defaultValue' | 'aria-label' | 'aria-labelledby'
> &
  GroupNameProps & {
    /** Shared `name` of the native radios. */
    name: string;
    options: readonly SegmentedOption<V>[];
    /** Selected value (controlled); `null` selects nothing. */
    value: V | null;
    onValueChange: (value: V) => void;
    disabled?: boolean;
  };

/**
 * Single-choice row of option buttons (Figma "Frequency choices" 3:14505 / option 3:14506): gap 6,
 * padding 9x13, radius 6, Inter 500 11px. Selected: accent fill and border, white label;
 * unselected: white, border-grey border, ink label. `role="radiogroup"` around visually hidden
 * native radios, so Tab enters the group at the selected option and the arrow keys move the
 * selection, as the browser does for radios.
 */
function SegmentedControlInner<V extends string>(
  {
    name,
    options,
    value,
    onValueChange,
    disabled = false,
    className,
    ...rest
  }: SegmentedControlProps<V>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-disabled={disabled || undefined}
      {...rest}
      className={cx(styles.group, className)}
    >
      {options.map((option) => {
        const checked = option.value === value;
        const isDisabled = disabled || option.disabled === true;
        return (
          <label
            key={option.value}
            className={styles.option}
            data-checked={checked || undefined}
            data-disabled={isDisabled || undefined}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              disabled={isDisabled}
              onChange={() => onValueChange(option.value)}
              className={cx(a11y.visuallyHidden, styles.input)}
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}

export const SegmentedControl = forwardRef(SegmentedControlInner) as <V extends string = string>(
  props: SegmentedControlProps<V> & { ref?: Ref<HTMLDivElement> },
) => ReactElement;
