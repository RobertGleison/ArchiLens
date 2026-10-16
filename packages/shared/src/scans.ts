/** Lifecycle of a scan job; matches the `jobs.status` CHECK constraint (migration 0001_initial). */
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

/**
 * A repository's scan state as shown in the UI, derived from its latest job and its freshness:
 *
 * - `queued`, `running`, `failed`, `cancelled`: the latest job's status, as is.
 * - `up_to_date`: the latest job succeeded and the repo has not changed since.
 * - `needs_attention`: the latest job succeeded but the result needs a look (e.g. the repo moved on
 *   since that scan, or its last scheduled run did not happen), so it is not up to date.
 *
 * `succeeded` is not a state of its own: a successful scan is either up to date or needs attention.
 */
export type RepoScanState =
  'up_to_date' | 'needs_attention' | 'queued' | 'running' | 'failed' | 'cancelled';
