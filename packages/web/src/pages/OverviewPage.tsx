import { HealthStatus } from '../HealthStatus';
import { PlaceholderPage } from './PlaceholderPage';

export function OverviewPage() {
  return (
    <PlaceholderPage
      title="Architecture, in view."
      description="A shared picture of how your systems evolve."
      breadcrumb={[{ label: 'Workspace', to: '/' }, { label: 'Overview' }]}
    >
      {/* Server status stays visible here until the Overview screen replaces this placeholder. */}
      <HealthStatus />
    </PlaceholderPage>
  );
}
