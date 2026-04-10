import { create } from 'zustand';

interface NavState {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export const useNavStore = create<NavState>((set) => ({
  activeCategory: '',
  setActiveCategory: (category) => set({ activeCategory: category }),
}));
