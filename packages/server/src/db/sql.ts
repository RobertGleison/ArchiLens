/** SQL expression for "now" as ISO-8601 UTC text, matching Date#toISOString(). */
export const NOW_SQL = `strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`;

/**
 * Builds `col = @key, ...` for the defined keys of a patch object, given a
 * camelCase -> snake_case column map. Undefined keys are skipped.
 */
export function setClause<K extends string>(
  patch: Partial<Record<K, unknown>>,
  columns: Record<K, string>,
): string[] {
  return (Object.keys(columns) as K[])
    .filter((key) => patch[key] !== undefined)
    .map((key) => `${columns[key]} = @${key}`);
}

export function toSqlBool(value: boolean): 0 | 1 {
  return value ? 1 : 0;
}
