import { ArrowRight, Maximize2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { DiagramCanvas, DiagramLegend } from '../ui/Diagram';
import {
  layoutDiagram,
  type DiagramEdgeSpec,
  type DiagramLayout,
  type DiagramNodeSpec,
} from '../ui/diagramLayout';
import { Edge } from '../ui/Edge';
import { EntityNode } from '../ui/EntityNode';
import { ICON_SIZE } from '../ui/icon';
import styles from './ComponentPreview.module.css';

/** Repository detail architecture map (Figma 3:13320), in reading order. */
const NODES: DiagramNodeSpec[] = [
  {
    id: 'gateway',
    name: 'API gateway',
    kind: 'gateway',
    subtitle: 'REST /v1/checkout',
    column: 0,
    row: 0,
  },
  {
    id: 'checkout',
    name: 'checkout-api',
    kind: 'service',
    subtitle: 'TypeScript · NestJS',
    column: 1,
    row: 0,
    variant: 'focus',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    kind: 'integration',
    subtitle: 'Payments integration',
    column: 2,
    row: 0,
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    kind: 'datastore',
    subtitle: 'Orders · managed RDS',
    column: 0,
    row: 1,
  },
  {
    id: 'redis',
    name: 'Redis',
    kind: 'datastore',
    subtitle: 'Session & idempotency cache',
    column: 1,
    row: 1,
  },
  {
    id: 'sqs',
    name: 'Amazon SQS',
    kind: 'queue',
    subtitle: 'Payment event queue',
    column: 2,
    row: 1,
  },
];

const EDGES: DiagramEdgeSpec[] = [
  { from: 'gateway', to: 'checkout', protocol: 'HTTPS' },
  { from: 'checkout', to: 'stripe', protocol: 'HTTPS' },
  { from: 'checkout', to: 'postgres' },
  { from: 'checkout', to: 'redis' },
  { from: 'checkout', to: 'sqs' },
];

const MAP = layoutDiagram({ nodes: NODES, edges: EDGES });

/** Report visual diff (3:13938): the Redis cache and its relationship are new; no focus node. */
const DIFF = layoutDiagram({
  nodes: NODES.map((n) =>
    n.id === 'redis'
      ? { ...n, name: 'Redis cache', variant: 'added' as const }
      : { ...n, variant: undefined },
  ),
  edges: EDGES.map((e) => (e.to === 'redis' ? { ...e, change: 'added' as const } : e)),
});

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const signed = (n: number, one: string, many: string) => `+${plural(n, one, many)}`;

const DIFF_COUNTS = {
  addedNodes: DIFF.nodes.filter((n) => n.props.variant === 'added').length,
  addedEdges: DIFF.relationships.filter((r) => r.change === 'added').length,
  removed:
    DIFF.nodes.filter((n) => n.props.variant === 'removed').length +
    DIFF.relationships.filter((r) => r.change === 'removed').length,
};

function ArchitectureMap({
  layout,
  note,
  onOpen,
}: {
  layout: DiagramLayout;
  note: string;
  onOpen?: (name: string) => void;
}) {
  return (
    <DiagramCanvas
      width={layout.width}
      height={layout.height}
      boundary="Checkout service / production"
      hosting="DEPLOYMENT · AWS ECS Fargate · 3 tasks · eu-west-1"
      note={note}
      relationships={layout.relationships}
    >
      {layout.edges.map((e) => (
        <Edge key={e.id} {...e.props} />
      ))}
      {layout.nodes.map((n) => (
        <EntityNode
          key={n.id}
          {...n.props}
          onClick={onOpen ? () => onOpen(n.props.name) : undefined}
        />
      ))}
    </DiagramCanvas>
  );
}

function Caption({ children }: { children: string }) {
  return <p className={styles.caption}>{children}</p>;
}

export function DiagramPreview() {
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <>
      <Caption>
        Repository detail architecture map (3:13320), layoutDiagram on a fixed 3×2 grid; nodes are
        buttons here
      </Caption>
      <div className={styles.diagramColumn}>
        <ArchitectureMap
          layout={MAP}
          note="Solid: evidence-backed relationship · Source references available for every entity"
          onOpen={setOpened}
        />
      </div>
      <p className={styles.caption} aria-live="polite">
        {opened ? `Opened ${opened}` : 'Click or press Enter on a node'}
      </p>
      <div className={styles.diagramColumn}>
        <DiagramLegend
          items={[
            { label: plural(MAP.nodes.length, 'entity', 'entities') },
            { label: plural(MAP.relationships.length, 'relationship', 'relationships') },
            { label: '23 evidence links', tone: 'accent' },
          ]}
          action={
            <Button size="sm" icon={Maximize2}>
              Expand diagram
            </Button>
          }
        />
      </div>

      <Caption>
        Report visual diff (3:13938): added entity and relationship in teal; nodes are not
        interactive here
      </Caption>
      <div className={styles.diagramColumn}>
        <ArchitectureMap
          layout={DIFF}
          note="Teal: added relationship or component · Grey: unchanged"
        />
      </div>
      <div className={styles.diagramColumn}>
        <DiagramLegend
          items={[
            { label: signed(DIFF_COUNTS.addedNodes, 'component', 'components'), tone: 'accent' },
            {
              label: signed(DIFF_COUNTS.addedEdges, 'relationship', 'relationships'),
              tone: 'accent',
            },
            { label: `${DIFF_COUNTS.removed} removed` },
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
