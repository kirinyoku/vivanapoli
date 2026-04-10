'use client';

import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';

interface CartTriggerProps {
  count?: number;
  className?: string;
  onClick?: () => void;
}

export default function CartTrigger({
  count: propCount,
  className,
  onClick,
}: CartTriggerProps) {
  const { getTotalItems } = useCartStore();
  const storeCount = getTotalItems();
  const count = propCount !== undefined ? propCount : storeCount;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full p-2 transition-colors hover:bg-black/5',
        className
      )}
    >
      <ShoppingCart className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
