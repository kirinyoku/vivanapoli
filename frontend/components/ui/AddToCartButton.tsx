'use client';

import Button from '@/components/ui/Button';

interface AddToCartButtonProps {
  itemId: string;
}

export default function AddToCartButton({ itemId }: AddToCartButtonProps) {
  const handleAdd = () => {
    console.log('Adding to cart:', itemId);
    // Logic with Zustand will go here later
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
