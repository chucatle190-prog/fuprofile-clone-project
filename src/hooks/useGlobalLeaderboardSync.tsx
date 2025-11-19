import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTopRankings } from './useTopRankings';
import { toast } from '@/hooks/use-toast';

interface LeaderboardEntry {
  user_id: string;
  amount: number;
}

export const useGlobalLeaderboardSync = (userId: string | undefined) => {
  const { setTopHolders, setTopReceivers, setTopSenders, latestRankChange } = useTopRankings();

  // Show toast notification when rank changes
  useEffect(() => {
    if (latestRankChange && latestRankChange.type === 'down') {
      const getCategoryName = () => {
        switch (latestRankChange.category) {
          case 'holder':
            return 'giữ CAMLY';
          case 'receiver':
            return 'nhận CAMLY';
          case 'sender':
            return 'chuyển CAMLY';
        }
      };

      toast({
        title: "⚠️ Thứ hạng thay đổi",
        description: `Ai đó đã vượt qua bạn trong bảng xếp hạng ${getCategoryName()}! Bạn đã xuống từ hạng ${latestRankChange.previousRank} xuống hạng ${latestRankChange.rank}.`,
        variant: "destructive",
      });
    }
  }, [latestRankChange]);

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

    // Setup realtime subscriptions with better channel names
    const walletsChannel = supabase
      .channel(`leaderboard-wallets-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_wallets'
        },
        (payload) => {
          console.log('Wallet change detected:', payload);
          fetchAndUpdateRankings();
        }
      )
      .subscribe((status) => {
        console.log('Wallets channel status:', status);
      });

    const transfersChannel = supabase
      .channel(`leaderboard-transfers-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'token_transfers'
        },
        (payload) => {
          console.log('Transfer detected:', payload);
          fetchAndUpdateRankings();
        }
      )
      .subscribe((status) => {
        console.log('Transfers channel status:', status);
      });

    return () => {
      supabase.removeChannel(walletsChannel);
      supabase.removeChannel(transfersChannel);
    };
  }, [userId, setTopHolders, setTopReceivers, setTopSenders]);
};
