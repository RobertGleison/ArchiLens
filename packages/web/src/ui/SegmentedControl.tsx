import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ForwardedRef,
  type ReactElement,
  type ReactNode,
  type Ref,
  useId,
} from 'react';
import { cx } from './cx';
import { fieldControlId, useField, useFieldGroupLabel } from './Field';
import styles from './SegmentedControl.module.css';
import a11y from './visuallyHidden.module.css';

export interface SegmentedOption<V extends string = string> {
  value: V;
  label: ReactNode;
  disabled?: boolean;
}

/**
 * The group must be named: by `aria-label`, by pointing `aria-labelledby` at a visible label, or
 * (neither prop) by an enclosing `Field`, whose label then names it. Unnamed outside a Field warns
 * in development.
 */
type GroupNameProps =
  | { 'aria-label': string; 'aria-labelledby'?: never }
  | { 'aria-label'?: never; 'aria-labelledby': string }
  | { 'aria-label'?: never; 'aria-labelledby'?: never };

export type SegmentedControlProps<V extends string = string> = Omit<
  ComponentPropsWithoutRef<'div'>,
  'onChange' | 'defaultValue' | 'aria-label' | 'aria-labelledby'
> &
  GroupNameProps & {
    /** Shared `name` of the native radios; generated when omitted. */
    name?: string;
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
 *
 * Inside a `Field` the Field's label names the group (`aria-labelledby`) and its help/error text
 * describes it; the Field's `disabled` applies unless `disabled` is set here.
 */
function SegmentedControlInner<V extends string>(
  {
    name,
    options,
    value,
    onValueChange,
    disabled: disabledProp,
    className,
    id,
    'aria-describedby': describedBy,
    ...rest
  }: SegmentedControlProps<V>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const uid = useId();
  const field = useField();
  useFieldGroupLabel(field);
  const groupName = name ?? `${uid}-segmented`;
  const disabled = disabledProp ?? field?.disabled ?? false;
  const named = rest['aria-label'] !== undefined || rest['aria-labelledby'] !== undefined;
  if (import.meta.env.DEV && !named && !field) {
    console.warn('SegmentedControl needs aria-label, aria-labelledby or an enclosing Field.');
  }
  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-disabled={disabled || undefined}
      aria-labelledby={named ? undefined : field?.labelId}
      aria-describedby={[field?.describedBy, describedBy].filter(Boolean).join(' ') || undefined}
      aria-required={field?.required || undefined}
      aria-invalid={field?.invalid || undefined}
      {...rest}
      id={fieldControlId(field, id)}
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
              name={groupName}
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
