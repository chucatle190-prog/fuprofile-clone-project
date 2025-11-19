import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TopRankingsState {
  topHolder: string | null;
  topReceiver: string | null;
  topSender: string | null;
  lastUpdated: number;
  setTopHolder: (userId: string | null) => void;
  setTopReceiver: (userId: string | null) => void;
  setTopSender: (userId: string | null) => void;
  isTopHolder: (userId: string) => boolean;
  isTopReceiver: (userId: string) => boolean;
  isTopSender: (userId: string) => boolean;
  getTopCategories: (userId: string) => string[];
}

export const useTopRankings = create<TopRankingsState>()(
  persist(
    (set, get) => ({
      topHolder: null,
      topReceiver: null,
      topSender: null,
      lastUpdated: 0,
      
      setTopHolder: (userId) => set({ topHolder: userId, lastUpdated: Date.now() }),
      setTopReceiver: (userId) => set({ topReceiver: userId, lastUpdated: Date.now() }),
      setTopSender: (userId) => set({ topSender: userId, lastUpdated: Date.now() }),
      
      isTopHolder: (userId) => get().topHolder === userId,
      isTopReceiver: (userId) => get().topReceiver === userId,
      isTopSender: (userId) => get().topSender === userId,
      
      getTopCategories: (userId) => {
        const categories: string[] = [];
        const state = get();
        
        if (state.topHolder === userId) categories.push('Giữ CAMLY nhiều nhất');
        if (state.topReceiver === userId) categories.push('Nhận CAMLY nhiều nhất');
        if (state.topSender === userId) categories.push('Chuyển CAMLY nhiều nhất');
        
        return categories;
      },
    }),
    {
      name: 'top-rankings-storage',
    }
  )
);
