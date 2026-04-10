import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'hot' | 'outline' | 'ghost';
  className?: string;
}

export default function Badge({
  children,
  variant = 'outline',
  className,
}: BadgeProps) {
  const variants = {
    success: 'bg-status-success-bg text-status-success-text',
    hot: 'bg-tag-hot-bg text-tag-hot-text uppercase font-bold',
    outline: 'border border-border-light text-text-muted',
    ghost: 'text-text-muted text-[10px] uppercase tracking-wider',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
