import {
  FileText,
  FolderGit2,
  History,
  LayoutDashboard,
  Network,
  Settings2,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

/** Primary navigation, in sidebar order (Figma `3:14421`). */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Overview', to: '/', icon: LayoutDashboard },
  { label: 'Repositories', to: '/repositories', icon: FolderGit2 },
  { label: 'Projects', to: '/projects', icon: Network },
  { label: 'Reports', to: '/reports', icon: FileText },
  { label: 'History', to: '/history', icon: History },
  { label: 'Configuration', to: '/configuration', icon: Settings2 },
];
