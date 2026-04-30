import { cn } from '@/lib/utils';

/**
 * Formats a numeric price in Norwegian kroner (NOK) convention.
 *
 * The format `{amount},-` (e.g. `189,-`) is the standard restaurant/menu
 * display in Norway. Using `tabular-nums` ensures all digits have equal
 * width, so prices align properly when listed in a column.
 */
interface PriceProps {
  amount: number | string;
  className?: string;
}

export default function Price({ amount, className }: PriceProps) {
  // Norwegian price format
  // Integer: 189,-
  // Decimal: 149,50
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  let formatted = '';
  if (Number.isInteger(numericAmount)) {
    formatted = `${numericAmount},-`;
  } else {
    formatted = numericAmount.toFixed(2).replace('.', ',');
  }

  return (
    <span
      className={cn(
        'font-heading text-text-dark text-lg font-semibold tabular-nums',
        className
      )}
    >
      {formatted}
    </span>
  );
}
