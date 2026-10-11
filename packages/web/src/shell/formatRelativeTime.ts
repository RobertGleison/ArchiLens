const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Short relative time in the design's wording, e.g. "just now", "2 min ago", "3 h ago". */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const elapsed = Math.max(0, now.getTime() - date.getTime());
  if (elapsed < MINUTE) return 'just now';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)} min ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)} h ago`;
  const days = Math.floor(elapsed / DAY);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}
