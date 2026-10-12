import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cx } from './cx';
import { ICON_SIZE } from './icon';
import type { IconComponent } from './iconTypes';
import styles from './IconButton.module.css';

export interface IconButtonProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'children' | 'aria-label' | 'aria-labelledby'
> {
  icon: IconComponent;
  /** Accessible name (rendered as `aria-label`); required because the button has no text. */
  label: string;
}

/** Icon-only `<button>` with an 18px icon, e.g. Help and Notifications in the utility bar. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, className, type = 'button', ...rest },
  ref,
) {
  if (import.meta.env.DEV && !label.trim()) {
    console.error('IconButton: `label` must be a non-empty accessible name.');
  }
  return (
    <button
      ref={ref}
      type={type}
      {...rest}
      aria-label={label}
      className={cx(styles.iconButton, className)}
    >
      <Icon size={ICON_SIZE.nav} aria-hidden />
    </button>
  );
});
