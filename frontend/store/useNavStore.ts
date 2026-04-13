import { create } from 'zustand';

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
