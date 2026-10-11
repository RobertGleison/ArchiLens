import type { Migration } from '../migrate.js';
import { initial } from './0001_initial.js';

/** All schema migrations, in the order they must be applied. Append only; never edit. */
export const MIGRATIONS: readonly Migration[] = [initial];
