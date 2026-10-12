import { CircleAlert } from 'lucide-react';
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { cx } from './cx';
import { ICON_SIZE } from './icon';
import { hasSlot } from './slot';
import styles from './Field.module.css';

interface FieldContextValue {
  controlId: string;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/** Props a form control takes from its enclosing `Field` (its own props win). */
export interface FieldControlProps {
  id?: string;
  required?: boolean;
  disabled?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
}

/**
 * Merges a control's props with its enclosing `Field`: the label's `id`, `aria-describedby`
 * (help and error text), `aria-invalid`, `required` and `disabled`. Used by `TextInput`, `Select`
 * and `Textarea`; outside a `Field` it returns the props unchanged.
 */
export function useFieldControl<P extends FieldControlProps>(props: P): P {
  const field = useContext(FieldContext);
  const describedBy =
    [field?.describedBy, props['aria-describedby']].filter(Boolean).join(' ') || undefined;
  const invalidProp = props['aria-invalid'];
  const invalid =
    invalidProp !== undefined ? invalidProp !== false && invalidProp !== 'false' : !!field?.invalid;
  return {
    ...props,
    id: props.id ?? field?.controlId,
    required: props.required ?? (field?.required || undefined),
    disabled: props.disabled ?? (field?.disabled || undefined),
    'aria-describedby': describedBy,
    'aria-invalid': invalid || undefined,
  };
}

export interface FieldProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Visible label (Inter 500 12px), linked to the control with `htmlFor`. */
  label: ReactNode;
  /** Optional help text under the control (11px muted), announced as the control's description. */
  description?: ReactNode;
  /**
   * Validation message. Marks the control `aria-invalid` and shows the message under it (11px,
   * ink, with a `circle-alert` icon). The design has no error colour, so this stays monochrome.
   */
  error?: ReactNode;
  /** Passed to the control as the native `required` (the design draws no required marker). */
  required?: boolean;
  /** Passed to the control as `disabled`. */
  disabled?: boolean;
  /** `id` for the control; generated when omitted. Set ids here, not on the control. */
  controlId?: string;
  /** One `TextInput`, `Select` or `Textarea` (or any control using `useFieldControl`). */
  children: ReactNode;
}

/**
 * Label + control column (Figma "Field", e.g. 3:13036): gap 6, label Inter 500 12px ink, optional
 * help and error text below the control. Wire the control by nesting it:
 *
 * ```tsx
 * <Field label="Visibility"><Select>…</Select></Field>
 * ```
 *
 * `className` and the other div props go on the wrapper; set widths there (e.g. 160px).
 */
export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  {
    label,
    description,
    error,
    required = false,
    disabled = false,
    controlId,
    className,
    children,
    ...rest
  },
  ref,
) {
  const uid = useId();
  const id = controlId ?? `${uid}-control`;
  const showDescription = hasSlot(description);
  const showError = hasSlot(error);
  const descriptionId = showDescription ? `${uid}-description` : undefined;
  const errorId = showError ? `${uid}-error` : undefined;
  const context: FieldContextValue = {
    controlId: id,
    // Error first: it is the more urgent of the two.
    describedBy: [errorId, descriptionId].filter(Boolean).join(' ') || undefined,
    invalid: showError,
    required,
    disabled,
  };

  return (
    <div ref={ref} {...rest} className={cx(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <FieldContext.Provider value={context}>{children}</FieldContext.Provider>
      {showError && (
        <p id={errorId} className={styles.error}>
          <CircleAlert size={ICON_SIZE.pill} aria-hidden className={styles.errorIcon} />
          <span>{error}</span>
        </p>
      )}
      {showDescription && (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      )}
    </div>
  );
});

export interface FieldRowProps extends ComponentPropsWithoutRef<'div'> {
  /** `filters` (gap 12, Discover 3:13035) or `form` (gap 16, History 3:14206 / Configuration). */
  spacing?: 'filters' | 'form';
  /** Vertical alignment; `end` lines a button up with the inputs (Discover 3:13159). */
  align?: 'start' | 'end';
}

/**
 * Horizontal row of fields. Children size themselves: give a field `className` with a fixed width,
 * or let it grow (fields without a width share the remaining space).
 */
export const FieldRow = forwardRef<HTMLDivElement, FieldRowProps>(function FieldRow(
  { spacing = 'filters', align = 'start', className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      {...rest}
      className={cx(
        styles.row,
        spacing === 'form' && styles.rowForm,
        align === 'end' && styles.rowEnd,
        className,
      )}
    />
  );
});
