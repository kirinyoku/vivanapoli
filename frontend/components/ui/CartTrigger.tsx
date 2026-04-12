'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';

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
  const [mounted, setMounted] = useState(false);
  const { getTotalItems } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const storeCount = mounted ? getTotalItems() : 0;
  const count = propCount !== undefined ? propCount : storeCount;

  const content = (
    <div
      className={cn(
        'relative inline-flex cursor-pointer items-center justify-center rounded-full p-2 transition-all duration-200 hover:bg-black/5 hover:shadow-md',
        className
      )}
    >
      <ShoppingCart className="h-6 w-6" />
      {count > 0 && (
        <span className="bg-primary absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="cursor-pointer border-none bg-transparent p-0"
      >
        {content}
      </button>
    );
  }

  return <Link href="/checkout">{content}</Link>;
}
