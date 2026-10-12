import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cx } from './cx';
import styles from './AnchorList.module.css';

export interface AnchorListItem {
  /** In-page target, e.g. `#executive-summary`. */
  href: string;
  label: ReactNode;
}

export interface AnchorListProps extends Omit<ComponentPropsWithoutRef<'nav'>, 'children'> {
  items: readonly AnchorListItem[];
  /** `href` of the section currently in view; shown in accent with `aria-current="location"`. */
  activeHref?: string;
  /** Names the navigation landmark, e.g. "In this report". */
  'aria-label': string;
}

/** In-page anchor list ("In this report", Figma 3:14118): 12px rows 16px apart, active in accent. */
export const AnchorList = forwardRef<HTMLElement, AnchorListProps>(function AnchorList(
  { items, activeHref, className, ...rest },
  ref,
) {
  return (
    <nav ref={ref} {...rest} className={className}>
      <ul className={styles.list}>
        {items.map((item) => {
          const active = item.href === activeHref;
          return (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={active ? 'location' : undefined}
                className={cx(styles.link, active && styles.active)}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});
