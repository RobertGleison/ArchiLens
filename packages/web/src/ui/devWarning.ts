const shown = new Set<string>();

/**
 * `console.warn` in development, once per distinct message (components call it during render,
 * which would otherwise repeat the warning on every re-render).
 */
export function warnOnce(message: string): void {
  if (!import.meta.env.DEV || shown.has(message)) return;
  shown.add(message);
  console.warn(message);
}
