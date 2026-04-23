'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import { useNavStore } from '@/store/useNavStore';

/**
 * Cart icon button with a numeric badge, used in the header / navigation.
 *
 * Handles hydration mismatch by deferring store access until `mounted` is `true`
 * (Next.js may SSR without the Zustand store's localStorage hydration, so the
 * server-rendered count would be 0 while the client shows a different value).
 *
 * The `count` prop takes precedence over the store value when provided, allowing
 * parent components to override the badge count (e.g. for SSR or testing).
 */
interface CartTriggerProps {
  count?: number;
  className?: string;
}

export default function CartTrigger({
  count: propCount,
  className,
}: CartTriggerProps) {
  /**
   * `mounted` guards against hydration mismatch: the cart store is hydrated
   * from localStorage on the client, so the server-rendered count is always 0.
   * By deferring to client-only rendering we avoid a flash of wrong content.
   */
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
        'relative inline-flex cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-2 transition-all duration-200 hover:bg-black/5 hover:shadow-md',
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
