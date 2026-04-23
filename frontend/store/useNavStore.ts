import { create } from 'zustand';

/**
 * Zustand store for UI navigation state.
 *
 * Tracks two pieces of global UI state:
 *  1. `activeCategory` — the currently highlighted menu category (used by
 *     `CategoryLink` for active styling and by `ScrollSpy` for auto-highlight).
 *  2. `isCartOpen` — whether the cart slide-out panel is visible.
 *
 * Unlike `useCartStore` this store is NOT persisted — both values are
 * ephemeral and reset on page reload.
 */
interface NavState {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  isCartOpen: boolean;
  toggleCart: () => void;
}

export const useNavStore = create<NavState>((set) => ({
  activeCategory: '',
  setActiveCategory: (category) => set({ activeCategory: category }),
  isCartOpen: false,
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
}));
