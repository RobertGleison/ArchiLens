import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { hasSlot } from './slot';
import styles from './PageHeading.module.css';

export interface BreadcrumbItem {
  label: string;
  /** Makes the segment a link. The last segment is the current page and is never linked. */
  to?: string;
}

export interface PageHeadingProps {
  title: ReactNode;
  description?: ReactNode;
  /** Shown uppercase above the title, e.g. Workspace / Overview. */
  breadcrumb?: readonly BreadcrumbItem[];
  /** Page actions (buttons), right aligned next to the title. */
  actions?: ReactNode;
  /** Optional metadata row under the heading (pills and muted text). */
  meta?: ReactNode;
}

/** Page heading used by every screen (Figma `3:12699`). Renders the page's `<h1>`. */
export function PageHeading({ title, description, breadcrumb, actions, meta }: PageHeadingProps) {
  return (
    <div className={styles.heading}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className={styles.breadcrumb}>
            {breadcrumb.map((item, i) => {
              const isLast = i === breadcrumb.length - 1;
              return (
                <Fragment key={`${i}-${item.label}`}>
                  {i > 0 && (
                    <li aria-hidden className={styles.separator}>
                      /
                    </li>
                  )}
                  <li>
                    {item.to && !isLast ? (
                      <Link to={item.to} className={styles.crumbLink}>
                        {item.label}
                      </Link>
                    ) : (
                      <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
                    )}
                  </li>
                </Fragment>
              );
            })}
          </ol>
        </nav>
      )}

      <div className={styles.row}>
        <div className={styles.text}>
          <h1 className={styles.title}>{title}</h1>
          {hasSlot(description) && <p className={styles.description}>{description}</p>}
        </div>
        {hasSlot(actions) && <div className={styles.actions}>{actions}</div>}
      </div>

      {hasSlot(meta) && <div className={styles.meta}>{meta}</div>}
    </div>
  );
}
