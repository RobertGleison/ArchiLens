import type { ReactNode } from 'react';
import { PageHeading, type BreadcrumbItem } from '../ui/PageHeading';
import styles from './PlaceholderPage.module.css';

export interface PlaceholderPageProps {
  title: string;
  description: string;
  breadcrumb: readonly BreadcrumbItem[];
  children?: ReactNode;
}

/** Temporary screen body until the real screen is built. */
export function PlaceholderPage({
  title,
  description,
  breadcrumb,
  children,
}: PlaceholderPageProps) {
  return (
    <>
      <PageHeading title={title} description={description} breadcrumb={breadcrumb} />
      {children ?? <p className={styles.note}>This screen is not built yet.</p>}
    </>
  );
}

const WORKSPACE: BreadcrumbItem = { label: 'Workspace', to: '/' };

export function RepositoriesPage() {
  return (
    <PlaceholderPage
      title="Repositories"
      description="GitHub repositories monitored by ArchiLens."
      breadcrumb={[WORKSPACE, { label: 'Repositories' }]}
    />
  );
}

export function ProjectsPage() {
  return (
    <PlaceholderPage
      title="Projects"
      description="Groups of repositories analysed together as one architecture."
      breadcrumb={[WORKSPACE, { label: 'Projects' }]}
    />
  );
}

export function ReportsPage() {
  return (
    <PlaceholderPage
      title="Reports"
      description="Architecture reports and the changes they found."
      breadcrumb={[WORKSPACE, { label: 'Reports' }]}
    />
  );
}

export function HistoryPage() {
  return (
    <PlaceholderPage
      title="History"
      description="How the architecture evolved over time."
      breadcrumb={[WORKSPACE, { label: 'History' }]}
    />
  );
}

export function ConfigurationPage() {
  return (
    <PlaceholderPage
      title="Configuration"
      description="GitHub connection, schedules, budgets and analysis settings."
      breadcrumb={[WORKSPACE, { label: 'Configuration' }]}
    />
  );
}
