import { ChevronDown } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cx } from './cx';
import { useFieldControl } from './Field';
import { ICON_SIZE } from './icon';
import type { IconComponent } from './iconTypes';
import styles from './FormControls.module.css';

/*
 * Text controls, Figma "Input" (3:13038, 3:13043) and "Feedback input" (3:14132). Each renders the
 * native element as the bordered box, so focus, typing and form submission are the browser's.
 * Inside a `Field` they pick up the label `id`, `aria-describedby`, `aria-invalid`, `required` and
 * `disabled` (see `useFieldControl`); outside one, name them with `aria-label`.
 *
 * Props routing (as in `Checkbox`): `className` goes on the wrapper; the ref and every other prop
 * go on the native element.
 */

export interface TextInputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'size'> {
  /** Trailing 14px decorative icon, e.g. `Search`, `Link`, `KeyRound` (as drawn in Figma). */
  icon?: IconComponent;
}

/** Single-line text input: 38px, radius 6, padding-x 12, 12px text, optional trailing icon. */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(props, ref) {
    const { icon: Icon, className, type = 'text', ...rest } = useFieldControl(props);
    return (
      <span className={cx(styles.wrapper, className)}>
        <input
          ref={ref}
          type={type}
          {...rest}
          className={cx(styles.control, styles.input, Icon && styles.withIcon)}
        />
        {Icon && <Icon size={ICON_SIZE.input} aria-hidden className={styles.icon} />}
      </span>
    );
  },
);

export type SelectProps = ComponentPropsWithoutRef<'select'>;

/**
 * Native `<select>` styled as the input box with a trailing 14px `chevron-down`. The options
 * list is the platform's own (accessible and keyboard operable everywhere); its panel styling
 * from the spec cannot be applied to native options.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(props, ref) {
  const { className, ...rest } = useFieldControl(props);
  return (
    <span className={cx(styles.wrapper, className)}>
      <select ref={ref} {...rest} className={cx(styles.control, styles.select, styles.withIcon)} />
      <ChevronDown size={ICON_SIZE.input} aria-hidden className={styles.icon} />
    </span>
  );
});

export type TextareaProps = ComponentPropsWithoutRef<'textarea'>;

/** Multi-line text: same border and radius as the input, padding 12, min-height 88 (3:14132). */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(props, ref) {
    const { className, ...rest } = useFieldControl(props);
    return (
      <span className={cx(styles.wrapper, className)}>
        <textarea ref={ref} {...rest} className={cx(styles.control, styles.textarea)} />
      </span>
    );
  },
);
