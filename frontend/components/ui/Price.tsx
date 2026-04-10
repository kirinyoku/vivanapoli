import { cn } from '@/lib/utils';

interface PriceProps {
  amount: number | string;
  className?: string;
}

export default function Price({ amount, className }: PriceProps) {
  // Norwegian price format (e.g., 189,-)
  const formatted = `${amount},-`;

  return (
    <span
      className={cn(
        'font-heading text-lg font-semibold tabular-nums text-text-dark',
        className
      )}
    >
      {formatted}
    </span>
  );
}
