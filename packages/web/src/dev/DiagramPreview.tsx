import { ArrowRight, Maximize2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { DiagramCanvas, DiagramLegend, type DiagramRelationship } from '../ui/Diagram';
import { diagramGrid, fanOutRoute, type Point } from '../ui/diagramLayout';
import { Edge } from '../ui/Edge';
import { EntityNode, type EntityKind, type EntityNodeVariant } from '../ui/EntityNode';
import { ICON_SIZE } from '../ui/icon';
import styles from './ComponentPreview.module.css';

interface MapEntity {
  name: string;
  kind: EntityKind;
  subtitle: string;
  column: number;
  row: number;
  variant?: EntityNodeVariant;
}

const grid = diagramGrid({ columns: 3, rows: 2 });

/** Repository detail architecture map (Figma 3:13320), reading order. */
const ENTITIES: MapEntity[] = [
  { name: 'API gateway', kind: 'gateway', subtitle: 'REST /v1/checkout', column: 0, row: 0 },
  {
    name: 'checkout-api',
    kind: 'service',
    subtitle: 'TypeScript · NestJS',
    column: 1,
    row: 0,
    variant: 'focus',
  },
  { name: 'Stripe', kind: 'integration', subtitle: 'Payments integration', column: 2, row: 0 },
  { name: 'PostgreSQL', kind: 'datastore', subtitle: 'Orders · managed RDS', column: 0, row: 1 },
  { name: 'Redis', kind: 'datastore', subtitle: 'Session & idempotency cache', column: 1, row: 1 },
  { name: 'Amazon SQS', kind: 'queue', subtitle: 'Payment event queue', column: 2, row: 1 },
];

const RELATIONSHIPS: DiagramRelationship[] = [
  { from: 'API gateway', to: 'checkout-api', protocol: 'HTTPS' },
  { from: 'checkout-api', to: 'Stripe', protocol: 'HTTPS' },
  { from: 'checkout-api', to: 'PostgreSQL' },
  { from: 'checkout-api', to: 'Redis' },
  { from: 'checkout-api', to: 'Amazon SQS' },
];

const storage = fanOutRoute(
  grid.anchor(1, 0, 'bottom'),
  [grid.anchor(0, 1, 'top'), grid.anchor(1, 1, 'top'), grid.anchor(2, 1, 'top')],
  grid.gapBelow(0),
);

const line = (from: Point, to: Point) => [from, to];

function ArchitectureMap({ diff = false }: { diff?: boolean }) {
  const entities = diff
    ? ENTITIES.map((e) =>
        e.name === 'Redis'
          ? { ...e, name: 'Redis cache', variant: 'added' as const }
          : { ...e, variant: undefined },
      )
    : ENTITIES;
  const relationships = diff
    ? RELATIONSHIPS.map((r) =>
        r.to === 'Redis' ? { ...r, to: 'Redis cache', change: 'added' as const } : r,
      )
    : RELATIONSHIPS;
  return (
    <DiagramCanvas
      width={grid.width}
      height={grid.height}
      boundary="Checkout service / production"
      hosting="DEPLOYMENT · AWS ECS Fargate · 3 tasks · eu-west-1"
      note={
        diff
          ? 'Teal: added relationship or component · Grey: unchanged'
          : 'Solid: evidence-backed relationship · Source references available for every entity'
      }
      relationships={relationships}
    >
      <Edge points={line(grid.anchor(0, 0, 'right'), grid.anchor(1, 0, 'left'))} label="HTTPS" />
      <Edge points={line(grid.anchor(1, 0, 'right'), grid.anchor(2, 0, 'left'))} label="HTTPS" />
      <Edge points={storage.trunk} arrow={false} />
      {storage.rail && <Edge points={storage.rail} arrow={false} />}
      {storage.branches.map((points, i) => (
        <Edge key={i} points={points} tone={diff && i === 1 ? 'accent' : 'neutral'} />
      ))}
      {entities.map((e) => (
        <EntityNode
          key={e.name}
          name={e.name}
          kind={e.kind}
          subtitle={e.subtitle}
          variant={e.variant}
          at={grid.cell(e.column, e.row)}
        />
      ))}
    </DiagramCanvas>
  );
}

function Caption({ children }: { children: string }) {
  return <p className={styles.caption}>{children}</p>;
}

export function DiagramPreview() {
  return (
    <>
      <Caption>Repository detail architecture map (3:13320), fixed 3×2 grid</Caption>
      <div className={styles.diagramColumn}>
        <ArchitectureMap />
      </div>
      <div className={styles.diagramColumn}>
        <DiagramLegend
          items={[
            { label: '6 entities' },
            { label: '7 relationships' },
            { label: '23 evidence links', tone: 'accent' },
          ]}
          action={
            <Button size="sm" icon={Maximize2}>
              Expand diagram
            </Button>
          }
        />
      </div>

      <Caption>Report visual diff (3:13938): added entity and relationship in teal</Caption>
      <div className={styles.diagramColumn}>
        <ArchitectureMap diff />
      </div>
      <div className={styles.diagramColumn}>
        <DiagramLegend
          items={[
            { label: '+1 component', tone: 'accent' },
            { label: '+2 relationships', tone: 'accent' },
            { label: '0 removed' },
            { label: 'Existing topology preserved' },
          ]}
        />
      </div>

      <Caption>EntityNode variants: default, focus, added, removed</Caption>
      <div className={styles.items}>
        <EntityNode name="Stripe" kind="integration" subtitle="Payments integration" />
        <EntityNode
          name="checkout-api"
          kind="service"
          subtitle="TypeScript · NestJS"
          variant="focus"
        />
        <EntityNode
          name="Redis cache"
          kind="datastore"
          subtitle="Session & idempotency cache"
          variant="added"
        />
        <EntityNode name="payments" kind="deployment" subtitle="ECS service" variant="removed" />
      </div>

      <Caption>Compact (History A/B boundary, 3:14339)</Caption>
      <div className={styles.chain}>
        <EntityNode compact name="checkout-api" />
        <ArrowRight size={ICON_SIZE.input} aria-hidden className={styles.chainArrow} />
        <EntityNode compact name="SQS" variant="focus" />
        <ArrowRight size={ICON_SIZE.input} aria-hidden className={styles.chainArrow} />
        <EntityNode compact name="payments" />
        <ArrowRight size={ICON_SIZE.input} aria-hidden className={styles.chainArrow} />
        <EntityNode compact name="legacy-sync" variant="removed" />
      </div>
    </>
  );
}
