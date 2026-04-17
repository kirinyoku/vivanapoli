'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import { useNavStore } from '@/store/useNavStore';

interface CartTriggerProps {
  count?: number;
  className?: string;
}

export default function CartTrigger({
  count: propCount,
  className,
}: CartTriggerProps) {
  const [mounted, setMounted] = useState(false);
  const { getTotalItems } = useCartStore();
  const { toggleCart } = useNavStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const storeCount = mounted ? getTotalItems() : 0;
  const count = propCount !== undefined ? propCount : storeCount;

  return (
    <button
      onClick={toggleCart}
      aria-label="Handlekurv"
      className={cn(
        'relative inline-flex cursor-pointer items-center justify-center rounded-full p-2 transition-all duration-200 hover:bg-black/5 hover:shadow-md border-none bg-transparent',
        className
      )}
    >
      <ShoppingCart className="h-6 w-6" />
      {count > 0 && (
        <span className="bg-primary absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
