import { Trophy, Award, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface SeasonChampionBadgeProps {
  userId: string;
  size?: "sm" | "md" | "lg";
}

interface Champion {
  season_number: number;
  rank: number;
  category: "holder" | "receiver" | "sender";
}

export const SeasonChampionBadge = ({ userId, size = "md" }: SeasonChampionBadgeProps) => {
  const [champions, setChampions] = React.useState<Champion[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchChampions = async () => {
      try {
        const { data, error } = await supabase
          .from('season_champions')
          .select('season_number, rank, category')
          .eq('user_id', userId)
          .order('season_number', { ascending: false });

        if (error) throw error;
        setChampions((data || []) as Champion[]);
      } catch (error) {
        console.error('Error fetching champions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchChampions();
    }
  }, [userId]);

  if (loading || champions.length === 0) return null;

  const getRankTitle = (rank: number) => {
    if (rank === 1) return "Quán quân";
    if (rank === 2) return "Á vua";
    if (rank === 3) return "Á quân";
    return "";
  };

  const getCategoryTitle = (category: string) => {
    if (category === 'holder') return "Giữ CAMLY";
    if (category === 'receiver') return "Nhận CAMLY";
    if (category === 'sender') return "Chuyển CAMLY";
    return "";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-3 h-3" />;
    if (rank === 2) return <Award className="w-3 h-3" />;
    if (rank === 3) return <Medal className="w-3 h-3" />;
    return null;
  };

  const getRankStyles = (rank: number) => {
    if (rank === 1) {
      return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 shadow-lg shadow-yellow-500/50 border-yellow-300";
    }
    if (rank === 2) {
      return "bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900 shadow-lg shadow-gray-400/50 border-gray-200";
    }
    if (rank === 3) {
      return "bg-gradient-to-r from-orange-400 to-orange-600 text-orange-900 shadow-lg shadow-orange-500/50 border-orange-300";
    }
    return "";
  };

  const topChampion = champions[0];

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-0.5",
    md: "text-xs px-2 py-0.5 gap-1",
    lg: "text-sm px-2.5 py-1 gap-1.5"
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Badge
          className={`
            ${getRankStyles(topChampion.rank)}
            ${sizeClasses[size]}
            cursor-pointer
            hover:scale-105
            transition-all
            duration-200
            font-bold
            border-2
            inline-flex
            items-center
            whitespace-nowrap
          `}
        >
          {getRankIcon(topChampion.rank)}
          <span>Mùa {topChampion.season_number}</span>
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4 bg-gradient-to-br from-background to-muted border-2 border-primary/20 shadow-2xl">
        <div className="space-y-3">
          <h4 className="font-bold text-lg text-primary flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Danh hiệu mùa giải
          </h4>
          <div className="space-y-2">
            {champions.map((champion, index) => (
              <div
                key={index}
                className={`
                  p-3 rounded-lg border-2
                  ${getRankStyles(champion.rank)}
                  flex items-center justify-between
                  hover:scale-[1.02]
                  transition-transform
                `}
              >
                <div className="flex items-center gap-2">
                  {getRankIcon(champion.rank)}
                  <div>
                    <div className="font-bold">
                      {getRankTitle(champion.rank)} Mùa {champion.season_number}
                    </div>
                    <div className="text-xs opacity-90">
                      {getCategoryTitle(champion.category)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

import React from "react";
import { supabase } from "@/integrations/supabase/client";