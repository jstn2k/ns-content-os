import { cn } from '@/lib/utils';

type Variant = 'primary' | 'outline' | 'ghost' | 'subtle' | 'destructive';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90',
  outline: 'border border-border bg-transparent hover:bg-muted',
  ghost: 'bg-transparent hover:bg-muted',
  subtle: 'bg-muted text-foreground hover:opacity-90',
  destructive: 'border border-destructive/40 text-destructive hover:bg-destructive/10',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
};

/** Shared button styling, usable on <button>, <a>, or <Link>. */
export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}
