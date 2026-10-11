import { Link } from 'react-router-dom';
import { PageHeading } from '../ui/PageHeading';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <>
      <PageHeading
        title="Page not found"
        description="There is nothing at this address."
        breadcrumb={[{ label: 'Workspace', to: '/' }, { label: 'Not found' }]}
      />
      <p className={styles.body}>
        <Link to="/" className={styles.link}>
          Go to Overview
        </Link>
      </p>
    </>
  );
}
