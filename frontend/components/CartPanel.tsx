'use client';

import Price from '@/components/ui/Price';
import Button from '@/components/ui/Button';

export default function CartPanel() {
  const mockItems = [
    { id: '1', name: 'Margherita', qty: 1, price: 189 },
    { id: '2', name: 'Diavola', qty: 1, price: 215 },
  ];

  const subtotal = mockItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  return (
    <aside className="hidden flex-col border-l border-border-light bg-bg-sidebar px-6 py-10 lg:flex">
      <div className="flex flex-col h-full">
        <h2 className="mb-8 font-heading text-3xl font-semibold text-text-dark">
          Din Bestilling
        </h2>

        <div className="flex-grow space-y-4 overflow-y-auto">
          {mockItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between font-body text-[0.95rem]"
            >
              <div className="flex gap-3">
                <span className="font-bold text-primary">{item.qty}x</span>
                <span className="text-text-dark">{item.name}</span>
              </div>
              <Price amount={item.price} className="text-sm" />
            </div>
          ))}
        </div>

        <div className="mt-auto pt-8 border-t-2 border-border-light">
          <div className="mb-2 flex items-center justify-between text-text-muted">
            <span>Subtotal</span>
            <Price amount={subtotal} className="text-sm text-text-muted" />
          </div>
          <div className="mb-8 flex items-center justify-between text-xl font-bold text-text-dark">
            <span>Total</span>
            <Price amount={subtotal} className="text-xl" />
          </div>

          <Button size="lg" className="w-full rounded-xl">
            Gå til kassen
          </Button>
          <p className="mt-4 text-center text-xs text-text-muted italic">
            Minste bestilling for levering er 200,-
          </p>
        </div>
      </div>
    </aside>
  );
}
