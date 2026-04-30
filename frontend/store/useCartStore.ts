import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * A single entry in the shopping cart, uniquely identified by `id`.
 *
 * The compound key for deduplication is `(menu_item_id + size)` —
 * the same menu item ordered in "small" and "large" sizes are separate
 * entries, while clicking the same size again increments `quantity`.
 */
export interface CartItem {
  id: string | number;
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
  size?: 'small' | 'large';
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeItem: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

/**
 * Zustand store for the shopping cart with `persist` middleware.
 *
 * Cart data is saved to `localStorage` under the key `viva-napoli-cart-v1`
 * so it survives page reloads. The persist middleware handles serialisation
 * and re-hydration automatically.
 *
 * Design decisions:
 *  - Cart entries use a unique UUID `id` (via `crypto.randomUUID()`) rather
 *    than a DB auto-increment because they are client-side only. This avoids
 *    collisions and keeps the store self-contained without a backend round-trip.
 *  - Items with the same `menu_item_id` + `size` are merged (quantity +1)
 *    rather than duplicated, preventing duplicate entries for the same
 *    product variant in the cart list.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      /**
       * Add an item to the cart or increment its quantity if it already exists.
       *
       * Matching is done on `(menu_item_id + size)` so that the same pizza
       * in "small" and "large" are treated as distinct cart entries.
       * New entries get a client-side unique `id` (UUID-based) and
       * start with `quantity: 1`.
       */
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
          const cartId =
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : Date.now();
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

      /**
       * Update the quantity of a specific cart entry.
       * Setting quantity to 0 or negative removes the entry entirely —
       * this is a convenience shortcut so callers don't need to check
       * boundaries before calling.
       */
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
      name: 'viva-napoli-cart-v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
