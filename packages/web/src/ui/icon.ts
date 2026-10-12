/**
 * Icon convention.
 *
 * Icons come from `lucide-react` (the set used in Figma). Import the icon component directly and
 * pass one of these sizes; never a raw number:
 *
 * ```tsx
 * import { Search } from 'lucide-react';
 * import { ICON_SIZE } from '../ui/icon';
 *
 * <Search size={ICON_SIZE.input} aria-hidden />
 * ```
 *
 * - Colour: icons draw with `currentColor`, so they take the surrounding text colour token.
 *   Set `color` on the parent (or the icon's className) instead of passing `color`.
 * - Decorative icons get `aria-hidden`; icon-only buttons need an `aria-label` on the button.
 * - Keep lucide's default stroke width.
 *
 * Version pin: `lucide-react` is held at 0.x because 1.x removed brand icons (the design uses
 * GitHub). Use `GithubIcon` from `./icons/GithubIcon` (same props shape, Simple Icons path)
 * rather than lucide's deprecated `Github`, so the pin can be lifted later without UI changes.
 */
export const ICON_SIZE = {
  /** Pills, checkbox check. */
  pill: 12,
  /** Input adornments (e.g. search). */
  input: 14,
  /** Buttons. */
  button: 15,
  /** Card titles, sidebar footer. */
  card: 16,
  /** Utility bar global search trigger. */
  search: 17,
  /** Nav items, utility bar. */
  nav: 18,
  /** Leading icon of a context notice. */
  notice: 18,
  /** The `blocks` product logo. */
  logo: 28,
} as const;

export type IconSize = keyof typeof ICON_SIZE;
