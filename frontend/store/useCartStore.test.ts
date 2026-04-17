import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './useCartStore';

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('should add items to the cart', () => {
    const item = {
      menu_item_id: 1,
      name: 'Pizza Margherita',
      price: 150,
      size: 'large' as const,
    };

    useCartStore.getState().addItem(item);
    const { items } = useCartStore.getState();

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      menu_item_id: 1,
      name: 'Pizza Margherita',
      quantity: 1,
    });
  });

  it('should increment quantity when adding the same item with same size', () => {
    const item = {
      menu_item_id: 1,
      name: 'Pizza Margherita',
      price: 150,
      size: 'large' as const,
    };

    useCartStore.getState().addItem(item);
    useCartStore.getState().addItem(item);
    const { items } = useCartStore.getState();

    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('should add different entries for different sizes of the same item', () => {
    useCartStore.getState().addItem({
      menu_item_id: 1,
      name: 'Pizza Margherita',
      price: 150,
      size: 'large',
    });
    useCartStore.getState().addItem({
      menu_item_id: 1,
      name: 'Pizza Margherita',
      price: 120,
      size: 'small',
    });

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(2);
  });

  it('should remove items correctly', () => {
    useCartStore.getState().addItem({
      menu_item_id: 1,
      name: 'Test',
      price: 100,
      size: 'large',
    });
    const item = useCartStore.getState().items[0];
    
    useCartStore.getState().removeItem(item.id);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('should calculate total price correctly', () => {
    useCartStore.getState().addItem({
      menu_item_id: 1,
      name: 'P1',
      price: 100,
      size: 'large',
    });
    useCartStore.getState().addItem({
      menu_item_id: 1,
      name: 'P1',
      price: 100,
      size: 'large',
    });
    useCartStore.getState().addItem({
      menu_item_id: 2,
      name: 'P2',
      price: 200,
      size: 'small',
    });

    expect(useCartStore.getState().getTotalPrice()).toBe(400);
    expect(useCartStore.getState().getTotalItems()).toBe(3);
  });

  it('should update quantity correctly', () => {
    useCartStore.getState().addItem({
      menu_item_id: 1,
      name: 'P1',
      price: 100,
      size: 'large',
    });
    const item = useCartStore.getState().items[0];
    
    useCartStore.getState().updateQuantity(item.id, 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
    
    useCartStore.getState().updateQuantity(item.id, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
