import {
  Activity,
  Blocks,
  Check,
  CircleAlert,
  FolderGit2,
  LayoutDashboard,
  Network,
  Plus,
  Search,
  Settings2,
} from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import tokensCss from '../styles/tokens.css?raw';
import { parseTokens, type Token } from '../styles/parseTokens';
import { ICON_SIZE, type IconSize } from '../ui/icon';
import { GithubIcon } from '../ui/icons/GithubIcon';
import styles from './TokenPreview.module.css';

const tokens = parseTokens(tokensCss);
const group = (prefix: string): Token[] => tokens.filter((t) => t.name.startsWith(prefix));

type Weight = 'regular' | 'medium' | 'semibold';

interface TypeMeta {
  weights: Weight[];
  uppercase?: boolean;
  example: string;
}

/**
 * Weights and sample text per type-scale entry. The entries themselves come from the
 * `--font-size-*` tokens; a test asserts this map covers exactly those names.
 */
export const TYPE_META: Record<string, TypeMeta> = {
  display: { weights: ['semibold'], example: 'Overview' },
  'display-sm': { weights: ['semibold'], example: '$1,240 / mo' },
  'stat-sm': { weights: ['semibold'], example: '+4' },
  title: { weights: ['semibold'], example: 'Recent reports' },
  'body-lg': { weights: ['semibold'], example: 'This report is out of date' },
  body: { weights: ['regular', 'semibold'], example: 'Architecture overview' },
  'body-sm': { weights: ['regular', 'medium', 'semibold'], example: 'acme/checkout' },
  caption: { weights: ['regular', 'medium'], example: 'Updated 2 hours ago' },
  overline: {
    weights: ['regular', 'medium', 'semibold'],
    uppercase: true,
    example: 'Pinned project',
  },
};

const FALLBACK_META: TypeMeta = { weights: ['regular'], example: 'The quick brown fox' };

const TYPE_SCALE = group('--font-size-').map((t) => {
  const name = t.name.slice('--font-size-'.length);
  return { name, ...(TYPE_META[name] ?? FALLBACK_META) };
});

const PREVIEW_ICONS = [
  LayoutDashboard,
  FolderGit2,
  Network,
  Settings2,
  Search,
  Plus,
  Check,
  CircleAlert,
  Activity,
  GithubIcon,
  Blocks,
];

export const TOKEN_PREVIEW_ICON_COUNT = PREVIEW_ICONS.length;

function TokenRow({ token, children }: { token: Token; children?: ReactNode }) {
  return (
    <li className={styles.row}>
      {children}
      <code className={styles.name}>{token.name}</code>
      <code className={styles.value}>{token.value}</code>
    </li>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

/** Dev-only page (`/__tokens`) that renders every design token for visual comparison with Figma. */
export function TokenPreview() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Design tokens</h1>

      <Section title="Color">
        <ul className={styles.list}>
          {group('--color-').map((t) => (
            <TokenRow key={t.name} token={t}>
              <span
                className={styles.swatch}
                style={{ background: `var(${t.name})` }}
                data-testid={`swatch${t.name}`}
              />
            </TokenRow>
          ))}
        </ul>
      </Section>

      <Section title="Type scale">
        <ul className={styles.list}>
          {TYPE_SCALE.map((type) =>
            type.weights.map((weight) => (
              <li key={`${type.name}-${weight}`} className={styles.typeRow}>
                <code className={styles.name}>
                  {type.name} / {weight}
                </code>
                <span
                  style={{
                    fontSize: `var(--font-size-${type.name})`,
                    fontWeight: `var(--font-weight-${weight})`,
                    textTransform: type.uppercase ? 'uppercase' : undefined,
                  }}
                >
                  {type.example}
                </span>
              </li>
            )),
          )}
          <li className={styles.typeRow}>
            <code className={styles.name}>mono / regular</code>
            <span className={styles.mono}>checkout.module.ts:12–34 ↗</span>
          </li>
        </ul>
      </Section>

      <Section title="Spacing">
        <ul className={styles.list}>
          {group('--space-').map((t) => (
            <TokenRow key={t.name} token={t}>
              <span className={styles.bar} style={{ width: `var(${t.name})` }} />
            </TokenRow>
          ))}
        </ul>
      </Section>

      <Section title="Radius">
        <ul className={styles.list}>
          {group('--radius-').map((t) => (
            <TokenRow key={t.name} token={t}>
              <span className={styles.radiusBox} style={{ borderRadius: `var(${t.name})` }} />
            </TokenRow>
          ))}
        </ul>
      </Section>

      <Section title="Sizes">
        <ul className={styles.list}>
          {group('--size-').map((t) => (
            <TokenRow key={t.name} token={t}>
              <span
                className={styles.sizeBar}
                style={{ '--preview-size': `var(${t.name})` } as CSSProperties}
              />
            </TokenRow>
          ))}
        </ul>
      </Section>

      <Section title="Icons (lucide-react)">
        <ul className={styles.list}>
          {(Object.keys(ICON_SIZE) as IconSize[]).map((size) => (
            <li key={size} className={styles.iconRow}>
              <code className={styles.name}>
                ICON_SIZE.{size} = {ICON_SIZE[size]}
              </code>
              <span className={styles.icons}>
                {PREVIEW_ICONS.map((IconComponent, i) => (
                  <IconComponent key={i} size={ICON_SIZE[size]} aria-hidden />
                ))}
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </main>
  );
}
