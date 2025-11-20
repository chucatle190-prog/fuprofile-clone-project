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

    let isSubscribed = true;

    const fetchAndUpdateRankings = async () => {
      if (!isSubscribed) return;
      
      try {
        // Fetch all three rankings in parallel for better performance
        const [holdersResult, receiversResult, sendersResult] = await Promise.all([
          supabase
            .from('user_wallets')
            .select('user_id, camly_balance')
            .order('camly_balance', { ascending: false })
            .limit(50),
          supabase
            .from('token_transfers')
            .select('receiver_id')
            .eq('status', 'completed'),
          supabase
            .from('token_transfers')
            .select('sender_id, amount')
            .eq('status', 'completed')
        ]);

        if (!isSubscribed) return;

        // Process holders
        if (holdersResult.data) {
          const holderIds = holdersResult.data.map(h => h.user_id);
          setTopHolders(holderIds, userId);
        }

        // Process receivers
        if (receiversResult.data) {
          const receiverCounts = receiversResult.data.reduce((acc, transfer) => {
            acc[transfer.receiver_id] = (acc[transfer.receiver_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const sortedReceivers = Object.entries(receiverCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 50)
            .map(([userId]) => userId);

          setTopReceivers(sortedReceivers, userId);
        }

        // Process senders
        if (sendersResult.data) {
          const senderTotals = sendersResult.data.reduce((acc, transfer) => {
            acc[transfer.sender_id] = (acc[transfer.sender_id] || 0) + Number(transfer.amount);
            return acc;
          }, {} as Record<string, number>);

          const sortedSenders = Object.entries(senderTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 50)
            .map(([userId]) => userId);

          setTopSenders(sortedSenders, userId);
        }
      } catch (error) {
        console.error('Error updating rankings:', error);
      }
    };

    // Initial fetch
    fetchAndUpdateRankings();

    // Setup realtime subscriptions with debouncing to prevent too many updates
    let updateTimeout: NodeJS.Timeout;
    
    const debouncedUpdate = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        fetchAndUpdateRankings();
      }, 500); // Wait 500ms before updating to batch rapid changes
    };

    const walletsChannel = supabase
      .channel(`leaderboard-wallets-${userId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_wallets'
        },
        (payload) => {
          console.log('Wallet change detected:', payload);
          debouncedUpdate();
        }
      )
      .subscribe((status) => {
        console.log('Wallets channel status:', status);
      });

    const transfersChannel = supabase
      .channel(`leaderboard-transfers-${userId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'token_transfers'
        },
        (payload) => {
          console.log('Transfer detected:', payload);
          debouncedUpdate();
        }
      )
      .subscribe((status) => {
        console.log('Transfers channel status:', status);
      });

    // Periodic refresh every 30 seconds to ensure sync
    const refreshInterval = setInterval(() => {
      if (isSubscribed) {
        fetchAndUpdateRankings();
      }
    }, 30000);

    return () => {
      isSubscribed = false;
      clearTimeout(updateTimeout);
      clearInterval(refreshInterval);
      supabase.removeChannel(walletsChannel);
      supabase.removeChannel(transfersChannel);
    };
  }, [userId, setTopHolders, setTopReceivers, setTopSenders]);
};
