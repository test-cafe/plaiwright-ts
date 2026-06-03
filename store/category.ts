import { create } from 'zustand';

interface State {
  activeId: number;
  locked: boolean;
  setActiveId: (activeId: number) => void;
  lockFor: (ms: number) => void;
}

export const useCategoryStore = create<State>((set) => ({
  activeId: 1,
  locked: false,
  setActiveId: (activeId) => set({ activeId }),
  lockFor: (ms) => {
    set({ locked: true });
    setTimeout(() => set({ locked: false }), ms);
  },
}));
