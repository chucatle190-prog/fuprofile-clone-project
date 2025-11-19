import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TopRankingsState {
  topHolders: string[];
  topReceivers: string[];
  topSenders: string[];
  lastUpdated: number;
  setTopHolders: (userIds: string[]) => void;
  setTopReceivers: (userIds: string[]) => void;
  setTopSenders: (userIds: string[]) => void;
  getUserRank: (userId: string, category: 'holder' | 'receiver' | 'sender') => number | null;
  getTopCategories: (userId: string) => Array<{ category: string; rank: number }>;
}

export const useTopRankings = create<TopRankingsState>()(
  persist(
    (set, get) => ({
      topHolders: [],
      topReceivers: [],
      topSenders: [],
      lastUpdated: 0,
      
      setTopHolders: (userIds) => set({ topHolders: userIds.slice(0, 10), lastUpdated: Date.now() }),
      setTopReceivers: (userIds) => set({ topReceivers: userIds.slice(0, 10), lastUpdated: Date.now() }),
      setTopSenders: (userIds) => set({ topSenders: userIds.slice(0, 10), lastUpdated: Date.now() }),
      
      getUserRank: (userId, category) => {
        const state = get();
        const list = category === 'holder' ? state.topHolders : 
                     category === 'receiver' ? state.topReceivers : 
                     state.topSenders;
        const index = list.indexOf(userId);
        return index !== -1 ? index + 1 : null;
      },
      
      getTopCategories: (userId) => {
        const categories: Array<{ category: string; rank: number }> = [];
        const state = get();
        
        const holderRank = state.topHolders.indexOf(userId) + 1;
        const receiverRank = state.topReceivers.indexOf(userId) + 1;
        const senderRank = state.topSenders.indexOf(userId) + 1;
        
        if (holderRank > 0 && holderRank <= 10) {
          categories.push({ category: 'Giữ CAMLY nhiều nhất', rank: holderRank });
        }
        if (receiverRank > 0 && receiverRank <= 10) {
          categories.push({ category: 'Nhận CAMLY nhiều nhất', rank: receiverRank });
        }
        if (senderRank > 0 && senderRank <= 10) {
          categories.push({ category: 'Chuyển CAMLY nhiều nhất', rank: senderRank });
        }
        
        return categories;
      },
    }),
    {
      name: 'top-rankings-storage',
    }
  )
);
