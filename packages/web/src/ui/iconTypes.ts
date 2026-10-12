import type { ComponentType } from 'react';

/** Props every icon component accepts: lucide icons and `GithubIcon` both fit. */
export interface IconComponentProps {
  size?: number | string;
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

/** An icon component to render inside a control, e.g. `icon={Plus}` or `icon={GithubIcon}`. */
export type IconComponent = ComponentType<IconComponentProps>;
