/** Joins element ids for `aria-labelledby` / `aria-describedby`; `undefined` when none are set. */
export function joinIds(...ids: (string | false | null | undefined)[]): string | undefined {
  const joined = ids.filter(Boolean).join(' ');
  return joined || undefined;
}
