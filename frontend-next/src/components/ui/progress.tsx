import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  colorClassName?: string;
}

export function ProgressBar({ value, className, colorClassName }: ProgressProps) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-white/10', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', colorClassName ?? 'bg-primary')}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}
