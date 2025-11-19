import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTopRankings } from './useTopRankings';

interface LeaderboardEntry {
  user_id: string;
  amount: number;
}

export const useGlobalLeaderboardSync = (userId: string | undefined) => {
  const { setTopHolders, setTopReceivers, setTopSenders } = useTopRankings();

  useEffect(() => {
    if (!userId) return;

    const fetchAndUpdateRankings = async () => {
      try {
        // Fetch holders
        const { data: holdersData } = await supabase
          .from('user_wallets')
          .select('user_id, camly_balance')
          .order('camly_balance', { ascending: false })
          .limit(10);

        if (holdersData) {
          const holderIds = holdersData.map(h => h.user_id);
          setTopHolders(holderIds, userId);
        }

        // Fetch receivers
        const { data: receiversData } = await supabase
          .from('token_transfers')
          .select('receiver_id')
          .eq('status', 'completed');

        if (receiversData) {
          const receiverCounts = receiversData.reduce((acc, transfer) => {
            acc[transfer.receiver_id] = (acc[transfer.receiver_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const sortedReceivers = Object.entries(receiverCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([userId]) => userId);

          setTopReceivers(sortedReceivers, userId);
        }

        // Fetch senders
        const { data: sendersData } = await supabase
          .from('token_transfers')
          .select('sender_id, amount')
          .eq('status', 'completed');

        if (sendersData) {
          const senderTotals = sendersData.reduce((acc, transfer) => {
            acc[transfer.sender_id] = (acc[transfer.sender_id] || 0) + Number(transfer.amount);
            return acc;
          }, {} as Record<string, number>);

          const sortedSenders = Object.entries(senderTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([userId]) => userId);

          setTopSenders(sortedSenders, userId);
        }
      } catch (error) {
        console.error('Error updating rankings:', error);
      }
    };

    // Initial fetch
    fetchAndUpdateRankings();

    // Setup realtime subscriptions
    const walletsChannel = supabase
      .channel('global-leaderboard-wallets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_wallets'
        },
        () => {
          fetchAndUpdateRankings();
        }
      )
      .subscribe();

    const transfersChannel = supabase
      .channel('global-leaderboard-transfers')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'token_transfers'
        },
        () => {
          fetchAndUpdateRankings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletsChannel);
      supabase.removeChannel(transfersChannel);
    };
  }, [userId, setTopHolders, setTopReceivers, setTopSenders]);
};
