import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Champion {
  rank: number;
  category: "holder" | "receiver" | "sender";
  season_number: number;
}

export const useSeasonChampionNotification = (userId: string | undefined) => {
  const [newChampion, setNewChampion] = useState<Champion | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Check for new champions on mount
    const checkNewChampions = async () => {
      try {
        const { data, error } = await supabase
          .from('season_champions')
          .select('rank, category, season_number, awarded_at')
          .eq('user_id', userId)
          .order('awarded_at', { ascending: false })
          .limit(1)
          .single();

        if (error || !data) return;

        // Check if this champion was awarded in the last 5 minutes
        const awardedAt = new Date(data.awarded_at);
        const now = new Date();
        const diffMinutes = (now.getTime() - awardedAt.getTime()) / 1000 / 60;

        if (diffMinutes < 5) {
          setNewChampion({
            rank: data.rank,
            category: data.category,
            season_number: data.season_number
          });
        }
      } catch (error) {
        console.error('Error checking new champions:', error);
      }
    };

    checkNewChampions();

    // Setup realtime subscription
    const channel = supabase
      .channel(`season-champions-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'season_champions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New champion awarded:', payload);
          const champion = payload.new as any;
          setNewChampion({
            rank: champion.rank,
            category: champion.category,
            season_number: champion.season_number
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const clearChampion = () => setNewChampion(null);

  return { newChampion, clearChampion };
};