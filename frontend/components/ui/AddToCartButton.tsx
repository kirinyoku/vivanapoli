'use client';

import Button from '@/components/ui/Button';
import { useCartStore } from '@/store/useCartStore';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddToCartButtonProps {
  itemId: number;
  name: string;
  price: number;
  size?: 'small' | 'large';
  variant?: 'primary' | 'outline' | 'link';
  className?: string;
  label?: string;
}

export default function AddToCartButton({
  itemId,
  name,
  price,
  size,
  variant = 'primary',
  className,
  label,
}: AddToCartButtonProps) {
  const { addItem } = useCartStore();

  const handleAdd = () => {
    addItem({
      menu_item_id: itemId,
      name,
      price,
      size,
    });
  };

  const buttonText = label || (variant === 'outline' ? 'Legg til' : 'Bestill');

  if (variant === 'link') {
    return (
      <button
        onClick={handleAdd}
        className={cn(
          "text-primary hover:text-primary-dark flex items-center gap-1 text-xs font-bold transition-colors hover:underline",
          className
        )}
      >
        {buttonText}
        <Plus className="h-3 w-3" />
      </button>
    );
  }

  return (
    <Button
      variant={variant === 'outline' ? 'outline' : 'primary'}
      size="sm"
      className={cn(
        "h-9 rounded-xl px-5 text-[10px] font-bold tracking-widest uppercase transition-all active:scale-95",
        variant === 'outline' 
          ? "border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40"
          : "bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/30",
        className
      )}
      onClick={handleAdd}
    >
      {buttonText}
      <Plus className="ml-2 h-3.5 w-3.5 opacity-70" />
    </Button>
  );
}
