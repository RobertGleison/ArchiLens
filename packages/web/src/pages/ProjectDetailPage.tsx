import { useParams } from 'react-router-dom';
import { PlaceholderPage } from './PlaceholderPage';

export function ProjectDetailPage() {
  const { projectId = '' } = useParams();
  return (
    <PlaceholderPage
      title={projectId}
      description="Project architecture, repositories and recent changes."
      breadcrumb={[
        { label: 'Workspace', to: '/' },
        { label: 'Projects', to: '/projects' },
        { label: projectId },
      ]}
    />
  );
}
