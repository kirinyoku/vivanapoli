'use client';

import { useState, useEffect } from 'react';
import Price from '@/components/ui/Price';
import Button from '@/components/ui/Button';
import { useCartStore } from '@/store/useCartStore';
import { Minus, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function CartPanel() {
  const [mounted, setMounted] = useState(false);
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const totalPrice = getTotalPrice();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || items.length === 0) {
    return (
      <aside className="hidden flex-col border-l border-border-light bg-bg-sidebar px-6 py-10 lg:flex">
        <div className="flex flex-col h-full">
          <h2 className="mb-8 font-heading text-3xl font-semibold text-text-dark">
            Din Bestilling
          </h2>
          <div className="flex flex-grow items-center justify-center text-center">
            <p className="text-text-muted italic">Kurven er tom</p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden flex-col border-l border-border-light bg-bg-sidebar px-6 py-10 lg:flex">
      <div className="flex flex-col h-full">
        <h2 className="mb-8 font-heading text-3xl font-semibold text-text-dark">
          Din Bestilling
        </h2>

        <div className="flex-grow space-y-6 overflow-y-auto pr-2">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="font-heading text-lg font-semibold text-text-dark leading-tight">
                    {item.name}
                  </span>
                  {item.size && (
                    <span className="text-xs text-text-muted uppercase tracking-wider">
                      {item.size === 'large' ? 'Stor' : 'Liten'}
                    </span>
                  )}
                </div>
                <Price amount={item.price * item.quantity} className="text-sm" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-border-light text-text-muted hover:bg-black/5 transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="min-w-[1.2rem] text-center text-sm font-bold text-primary">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-border-light text-text-muted hover:bg-black/5 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-text-muted hover:text-red-600 transition-colors"
                  title="Fjern"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-8 border-t-2 border-border-light">
          <div className="mb-2 flex items-center justify-between text-text-muted">
            <span>Subtotal</span>
            <Price amount={totalPrice} className="text-sm text-text-muted" />
          </div>
          <div className="mb-8 flex items-center justify-between text-xl font-bold text-text-dark">
            <span>Total</span>
            <Price amount={totalPrice} className="text-xl" />
          </div>

          <Link href="/checkout">
            <Button size="lg" className="w-full rounded-xl">
              Gå til kassen
            </Button>
          </Link>
          <p className="mt-4 text-center text-xs text-text-muted italic">
            Minste bestilling for levering er 200,-
          </p>
        </div>
      </div>
    </aside>
  );
}

