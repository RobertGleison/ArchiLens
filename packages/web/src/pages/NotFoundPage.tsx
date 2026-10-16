import { CircleAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import styles from './NotFoundPage.module.css';

/** Page-level "not found": the `EmptyState` layout with `circle-alert` (LIN-87). */
export function NotFoundPage() {
  return (
    <EmptyState
      className={styles.page}
      icon={CircleAlert}
      headingLevel={1}
      title="Page not found"
      description="There is nothing at this address."
      action={<Button to="/">Back to Overview</Button>}
    />
  );
}
