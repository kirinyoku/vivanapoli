'use client';

import Button from '@/components/ui/Button';
import { useCartStore } from '@/store/useCartStore';

interface AddToCartButtonProps {
  itemId: number;
  name: string;
  price: number;
  size?: 'small' | 'large';
}

export default function AddToCartButton({
  itemId,
  name,
  price,
  size,
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

  return (
    <Button
      variant="link"
      className="text-primary hover:underline"
      onClick={handleAdd}
    >
      Legg til +
    </Button>
  );
}
