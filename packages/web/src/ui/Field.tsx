import { CircleAlert } from 'lucide-react';
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useLayoutEffect,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { cx } from './cx';
import { ICON_SIZE } from './icon';
import { hasSlot } from './slot';
import styles from './Field.module.css';

export interface FieldContextValue {
  /** `id` of the control; the visible label points at it with `htmlFor`. */
  controlId: string;
  /** `id` of the visible label, for controls labelled with `aria-labelledby` (groups). */
  labelId: string;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  /** A group control (e.g. `SegmentedControl`) calls this so the label drops `htmlFor`. */
  setGroupLabel: (group: boolean) => void;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/** The enclosing `Field`, or `null`. For controls that wire themselves (Switch, Checkbox…). */
export function useField(): FieldContextValue | null {
  return useContext(FieldContext);
}

/** Hides an enclosing `Field` from controls that label themselves (e.g. `PreferenceRow`). */
export function FieldReset({ children }: { children: ReactNode }) {
  return <FieldContext.Provider value={null}>{children}</FieldContext.Provider>;
}

/**
 * The id a control inside a `Field` must use: always the Field's `controlId`, so the label's
 * `htmlFor` resolves. Warns in development when the control was given a different `id`.
 */
export function fieldControlId(
  field: FieldContextValue | null,
  ownId: string | undefined,
): string | undefined {
  if (!field) return ownId;
  if (import.meta.env.DEV && ownId !== undefined && ownId !== field.controlId) {
    console.warn(
      `Field: the control's id "${ownId}" is ignored; pass controlId="${ownId}" to the Field instead.`,
    );
  }
  return field.controlId;
}

/**
 * Registers a group control (labelled with `aria-labelledby={field.labelId}`, not by `htmlFor`)
 * with its enclosing `Field`, so the label renders without a dangling `htmlFor`.
 */
export function useFieldGroupLabel(field: FieldContextValue | null): void {
  const setGroupLabel = field?.setGroupLabel;
  useLayoutEffect(() => {
    if (!setGroupLabel) return;
    setGroupLabel(true);
    return () => setGroupLabel(false);
  }, [setGroupLabel]);
}

/** Props a form control takes from its enclosing `Field` (its own props win, except `id`). */
export interface FieldControlProps {
  id?: string;
  required?: boolean;
  disabled?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
}

/**
 * Merges a control's props with its enclosing `Field`: the Field's `controlId` (always; see
 * `fieldControlId`), `aria-describedby` (help and error text, then the control's own),
 * `aria-invalid`, `required` and `disabled`. Used by `TextInput`, `Select`, `Textarea` and
 * `Checkbox`; outside a `Field` it returns the props unchanged.
 */
export function useFieldControl<P extends FieldControlProps>(props: P): P {
  const field = useContext(FieldContext);
  const id = fieldControlId(field, props.id);
  const describedBy =
    [field?.describedBy, props['aria-describedby']].filter(Boolean).join(' ') || undefined;
  const invalidProp = props['aria-invalid'];
  const invalid =
    invalidProp !== undefined ? invalidProp !== false && invalidProp !== 'false' : !!field?.invalid;
  return {
    ...props,
    id,
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
  /** Passed to the control as `disabled`; the label dims while the control is disabled. */
  disabled?: boolean;
  /** `id` for the control; generated when omitted. Set ids here: a control's own `id` is ignored. */
  controlId?: string;
  /**
   * Exactly one control: `TextInput`, `Select`, `Textarea`, `Switch`, `Checkbox` or
   * `SegmentedControl` (or any control using `useFieldControl` / `useField`). Every control in a
   * Field gets the same `controlId`, so two controls would share an id.
   */
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
 * Text controls, `Switch` and `Checkbox` are labelled with `<label htmlFor>`; a group control
 * (`SegmentedControl`) is labelled with `aria-labelledby` and the label is then a plain `<span>`.
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
  const labelId = `${uid}-label`;
  const [groupLabel, setGroupLabel] = useState(false);
  const showDescription = hasSlot(description);
  const showError = hasSlot(error);
  const descriptionId = showDescription ? `${uid}-description` : undefined;
  const errorId = showError ? `${uid}-error` : undefined;
  const context: FieldContextValue = {
    controlId: id,
    labelId,
    setGroupLabel,
    // Error first: it is the more urgent of the two.
    describedBy: [errorId, descriptionId].filter(Boolean).join(' ') || undefined,
    invalid: showError,
    required,
    disabled,
  };

  return (
    <div ref={ref} {...rest} className={cx(styles.field, className)}>
      {groupLabel ? (
        <span id={labelId} className={styles.label}>
          {label}
        </span>
      ) : (
        <label id={labelId} htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
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
  /**
   * Vertical alignment. `end` aligns children to the bottom, so a button lines up with the inputs
   * (Discover 3:13159). Only while no field in the row shows help or error text: that text sits
   * under the input, and the button then lines up with the text instead.
   */
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
