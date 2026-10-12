import type { ReactNode } from 'react';
import styles from './layout.module.css';

export interface MainAsideProps {
  main: ReactNode;
  aside: ReactNode;
  /** `wide` = 390px aside (Overview), `default` = 346px aside (detail screens). */
  asideWidth?: 'default' | 'wide';
  /**
   * Element for the aside column. Defaults to `div` because the layout sits inside `<main>`;
   * use `aside` only for content that is genuinely complementary to the page.
   */
  asideAs?: 'div' | 'aside';
}

/** Main column + fixed-width aside with a 24px gap (746 + 390 / 790 + 346 at 1440px). */
export function MainAside({
  main,
  aside,
  asideWidth = 'default',
  asideAs: Aside = 'div',
}: MainAsideProps) {
  return (
    <div
      className={asideWidth === 'wide' ? `${styles.mainAside} ${styles.wide}` : styles.mainAside}
    >
      <div className={styles.main}>{main}</div>
      <Aside className={styles.aside}>{aside}</Aside>
    </div>
  );
}

/** Four equal columns with a 16px gap, for stat tiles. */
export function StatGrid({ children }: { children: ReactNode }) {
  return <div className={styles.statGrid}>{children}</div>;
}
