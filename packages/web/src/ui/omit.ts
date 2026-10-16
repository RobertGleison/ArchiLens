/** Returns a shallow copy of `props` without `keys` (used to forward the rest to the element). */
export function omit<T extends object, K extends keyof T>(
  props: T,
  keys: readonly K[],
): Omit<T, K> {
  const rest = { ...props };
  for (const key of keys) delete rest[key];
  return rest;
}
