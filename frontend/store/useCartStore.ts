import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: number;
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
  size?: 'small' | 'large';
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(
          (item) =>
            item.menu_item_id === newItem.menu_item_id &&
            item.size === newItem.size
        );

        if (existingItemIndex !== -1) {
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += 1;
          set({ items: updatedItems });
        } else {
          // Using timestamp as a simple unique ID for cart entries
          // (allows having multiple separate entries for same menu item if needed, though we group by size here)
          const cartId = Date.now();
          set({
            items: [...items, { ...newItem, id: cartId, quantity: 1 }],
          });
        }
      },

      removeItem: (id) => {
        set({
          items: get().items.filter((item) => item.id !== id),
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'viva-napoli-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
