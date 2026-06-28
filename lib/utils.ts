/** Tiny className combiner (no dependency). Falsy values are dropped. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** Format a Date (or ISO string) as e.g. "Jun 28, 9:00 AM". */
export function formatDateTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Format a Date (or ISO string) as e.g. "Jun 28". */
export function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
