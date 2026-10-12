import { Check, Minus } from 'lucide-react';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ComponentPropsWithoutRef,
} from 'react';
import { cx } from './cx';
import { ICON_SIZE } from './icon';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'size'> {
  /** Mixed state (some but not all of a group selected); shown as a minus, announced as mixed. */
  indeterminate?: boolean;
}

/**
 * Checkbox (Figma 3:13067 / 3:13121): 16px, radius 3. Checked: accent fill and border with a white
 * 12px check. Unchecked: white with a border-grey border. A native `<input type="checkbox">`, so
 * Space toggles it and assistive tech announces it; name it with `aria-label` or a `<label>`.
 *
 * The input is transparent and spans a 24px hit area centred on the 16px box (WCAG 2.5.8), without
 * changing layout. Hover, focus, indeterminate and disabled are derived (not drawn in Figma).
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { indeterminate = false, className, ...rest },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <span className={cx(styles.root, className)}>
      <input ref={inputRef} type="checkbox" {...rest} className={styles.input} />
      <span className={styles.box} aria-hidden>
        <Check size={ICON_SIZE.pill} className={styles.check} />
        <Minus size={ICON_SIZE.pill} className={styles.mixed} />
      </span>
    </span>
  );
});
