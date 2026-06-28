import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'warning' | 'destructive' | 'accent' | 'outline';

const VARIANTS: Record<Variant, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  accent: 'bg-accent/10 text-accent',
  outline: 'border border-border text-muted-foreground',
};

export function Badge({
  variant = 'default',
  className,
  children,
}: {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
