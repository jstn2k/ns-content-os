import { cn } from '@/lib/utils';

/** Simple labeled horizontal bar for lightweight charts (no chart lib needed). */
export function Bar({
  label,
  value,
  max = 1,
  hint,
  className,
}: {
  label: string;
  value: number;
  max?: number;
  hint?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground">{label}</span>
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
