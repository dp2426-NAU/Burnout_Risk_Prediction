import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'critical';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-primary/20 text-primary border border-primary/40',
    outline: 'border border-white/20 text-white/80',
    critical: 'bg-red-600/20 text-red-200 border border-red-500/60',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
