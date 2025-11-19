import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RankChange {
  category: 'holder' | 'receiver' | 'sender';
  rank: number;
  previousRank: number | null;
  timestamp: number;
}

interface TopRankingsState {
  topHolders: string[];
  topReceivers: string[];
  topSenders: string[];
  lastUpdated: number;
  previousRanks: {
    holder: number | null;
    receiver: number | null;
    sender: number | null;
  };
  latestRankChange: RankChange | null;
  setTopHolders: (userIds: string[], currentUserId?: string) => void;
  setTopReceivers: (userIds: string[], currentUserId?: string) => void;
  setTopSenders: (userIds: string[], currentUserId?: string) => void;
  getUserRank: (userId: string, category: 'holder' | 'receiver' | 'sender') => number | null;
  getTopCategories: (userId: string) => Array<{ category: string; rank: number }>;
  clearRankChange: () => void;
}

export const useTopRankings = create<TopRankingsState>()(
  persist(
    (set, get) => ({
      topHolders: [],
      topReceivers: [],
      topSenders: [],
      lastUpdated: 0,
      previousRanks: {
        holder: null,
        receiver: null,
        sender: null,
      },
      latestRankChange: null,
      
      setTopHolders: (userIds, currentUserId) => {
        const state = get();
        const newList = userIds.slice(0, 10);
        
        if (currentUserId) {
          const previousRank = state.topHolders.indexOf(currentUserId) !== -1 
            ? state.topHolders.indexOf(currentUserId) + 1 
            : null;
          const newRank = newList.indexOf(currentUserId) !== -1 
            ? newList.indexOf(currentUserId) + 1 
            : null;
          
          // Check if rank improved (lower number = better rank)
          if (newRank && (previousRank === null || newRank < previousRank)) {
            set({ 
              latestRankChange: {
                category: 'holder',
                rank: newRank,
                previousRank: previousRank,
                timestamp: Date.now()
              }
            });
          }
          
          set(state => ({
            previousRanks: { ...state.previousRanks, holder: newRank }
          }));
        }
        
        set({ topHolders: newList, lastUpdated: Date.now() });
      },
      
      setTopReceivers: (userIds, currentUserId) => {
        const state = get();
        const newList = userIds.slice(0, 10);
        
        if (currentUserId) {
          const previousRank = state.topReceivers.indexOf(currentUserId) !== -1 
            ? state.topReceivers.indexOf(currentUserId) + 1 
            : null;
          const newRank = newList.indexOf(currentUserId) !== -1 
            ? newList.indexOf(currentUserId) + 1 
            : null;
          
          if (newRank && (previousRank === null || newRank < previousRank)) {
            set({ 
              latestRankChange: {
                category: 'receiver',
                rank: newRank,
                previousRank: previousRank,
                timestamp: Date.now()
              }
            });
          }
          
          set(state => ({
            previousRanks: { ...state.previousRanks, receiver: newRank }
          }));
        }
        
        set({ topReceivers: newList, lastUpdated: Date.now() });
      },
      
      setTopSenders: (userIds, currentUserId) => {
        const state = get();
        const newList = userIds.slice(0, 10);
        
        if (currentUserId) {
          const previousRank = state.topSenders.indexOf(currentUserId) !== -1 
            ? state.topSenders.indexOf(currentUserId) + 1 
            : null;
          const newRank = newList.indexOf(currentUserId) !== -1 
            ? newList.indexOf(currentUserId) + 1 
            : null;
          
          if (newRank && (previousRank === null || newRank < previousRank)) {
            set({ 
              latestRankChange: {
                category: 'sender',
                rank: newRank,
                previousRank: previousRank,
                timestamp: Date.now()
              }
            });
          }
          
          set(state => ({
            previousRanks: { ...state.previousRanks, sender: newRank }
          }));
        }
        
        set({ topSenders: newList, lastUpdated: Date.now() });
      },
      
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
      
      clearRankChange: () => set({ latestRankChange: null }),
    }),
    {
      name: 'top-rankings-storage',
    }
  )
);
