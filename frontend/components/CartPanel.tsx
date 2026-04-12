'use client';

import { useState, useEffect } from 'react';
import Price from '@/components/ui/Price';
import Button from '@/components/ui/Button';
import { useCartStore } from '@/store/useCartStore';
import { Minus, Plus, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { RestaurantSettings } from '@/types';

export default function CartPanel() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const totalPrice = getTotalPrice();

  useEffect(() => {
    setMounted(true);
    api.getSettings().then(setSettings).catch(console.error);
  }, []);

  const minOrderPrice = settings
    ? parseInt(settings.min_order_price) || 200
    : 200;
  const isBelowMinOrder = totalPrice < minOrderPrice;
  const remainingToMin = minOrderPrice - totalPrice;

  if (!mounted || items.length === 0) {
    return (
      <aside className="border-border-light bg-bg-sidebar hidden flex-col border-l px-6 py-10 lg:flex">
        <div className="flex h-full flex-col">
          <h2 className="font-heading text-text-dark mb-8 text-3xl font-semibold">
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
    <aside className="border-border-light bg-bg-sidebar hidden flex-col border-l px-6 py-10 lg:flex">
      <div className="flex h-full flex-col">
        <h2 className="font-heading text-text-dark mb-8 text-3xl font-semibold">
          Din Bestilling
        </h2>

        <div className="custom-scrollbar flex-grow space-y-6 overflow-y-auto pr-2">
          {items.map((item) => (
            <div key={item.id} className="group flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="font-heading text-text-dark group-hover:text-primary text-lg leading-tight font-semibold transition-colors">
                    {item.name}
                  </span>
                  {item.size && (
                    <span className="text-text-muted mt-1 text-[10px] font-bold tracking-[0.2em] uppercase">
                      {item.size === 'large' ? 'Stor' : 'Liten'}
                    </span>
                  )}
                </div>
                <Price
                  amount={item.price * item.quantity}
                  className="text-sm font-bold"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="border-border-light text-text-muted hover:border-text-muted flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 hover:bg-black/5 hover:shadow-md"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-primary min-w-[1.2rem] text-center text-sm font-bold">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="border-border-light text-text-muted hover:border-text-muted flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 hover:bg-black/5 hover:shadow-md"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-text-muted cursor-pointer transition-all duration-200 hover:text-red-600 hover:shadow-sm"
                  title="Fjern"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-border-light mt-auto border-t-2 pt-8">
          {isBelowMinOrder && (
            <div className="bg-primary/5 border-primary/10 mb-6 flex animate-pulse items-start gap-3 rounded-2xl border p-4">
              <AlertCircle className="text-primary mt-0.5 h-5 w-5 shrink-0" />
              <div className="text-text-dark text-xs leading-relaxed font-medium">
                Legg til{' '}
                <span className="text-primary font-bold">
                  {remainingToMin},-
                </span>{' '}
                mer for å kunne bestille.
              </div>
            </div>
          )}

          <div className="text-text-muted mb-2 flex items-center justify-between">
            <span className="text-xs font-bold tracking-widest uppercase">
              Subtotal
            </span>
            <Price amount={totalPrice} className="text-sm font-bold" />
          </div>
          <div className="mb-8 flex items-center justify-between">
            <span className="font-heading text-text-dark text-2xl font-semibold">
              Total
            </span>
            <Price amount={totalPrice} className="text-primary text-2xl" />
          </div>

          <Link
            href={isBelowMinOrder ? '#' : '/checkout'}
            className={isBelowMinOrder ? 'cursor-not-allowed' : ''}
          >
            <Button
              size="lg"
              className={`w-full rounded-2xl py-6 shadow-xl transition-all ${isBelowMinOrder ? 'bg-text-muted/20 text-text-muted shadow-none' : 'shadow-primary/30 active:scale-95'}`}
              disabled={isBelowMinOrder}
            >
              Gå til kassen
            </Button>
          </Link>
          <p className="text-text-muted mt-4 text-center text-[10px] font-bold tracking-widest uppercase opacity-60">
            Minste bestilling: {minOrderPrice},-
          </p>
        </div>
      </div>
    </aside>
  );
}
