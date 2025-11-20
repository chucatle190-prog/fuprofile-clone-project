import React from "react";
import { Crown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Badge } from "./ui/badge";
import { useTopRankings } from "@/hooks/useTopRankings";
import { supabase } from "@/integrations/supabase/client";

interface TopOneBadgeProps {
  userId: string;
  size?: "sm" | "md" | "lg";
}

interface Champion {
  season_number: number;
  rank: number;
  category: "holder" | "receiver" | "sender";
}

export default function TopOneBadge({ userId, size = "md" }: TopOneBadgeProps) {
  const { getTopCategories } = useTopRankings();
  const categories = getTopCategories(userId);
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
  
  if (categories.length === 0) return null;
  
  // Get the highest rank (lowest number)
  const topRank = Math.min(...categories.map(c => c.rank));
  
  const hasSeasonChampion = !loading && champions.length > 0;
  
  const sizeClasses = {
    sm: "h-4 w-4 text-[10px]",
    md: "h-5 w-5 text-xs",
    lg: "h-6 w-6 text-sm"
  };
  
  const getRankStyles = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          gradient: "from-yellow-400 via-amber-500 to-yellow-600",
          border: "border-yellow-300",
          blur: "from-yellow-400 via-amber-500 to-yellow-600",
          popoverBg: "from-yellow-50 via-amber-50 to-yellow-100 dark:from-yellow-950 dark:via-amber-950 dark:to-yellow-900",
          popoverBorder: "border-yellow-400",
          iconColor: "text-yellow-600 dark:text-yellow-300 fill-yellow-600 dark:fill-yellow-300",
          textColor: "text-yellow-700 dark:text-yellow-200",
          cardBorder: "border-yellow-300 dark:border-yellow-600"
        };
      case 2:
        return {
          gradient: "from-gray-300 via-gray-400 to-gray-500",
          border: "border-gray-300",
          blur: "from-gray-300 via-gray-400 to-gray-500",
          popoverBg: "from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
          popoverBorder: "border-gray-400",
          iconColor: "text-gray-600 dark:text-gray-300 fill-gray-600 dark:fill-gray-300",
          textColor: "text-gray-700 dark:text-gray-200",
          cardBorder: "border-gray-300 dark:border-gray-600"
        };
      case 3:
        return {
          gradient: "from-amber-600 via-orange-500 to-amber-700",
          border: "border-orange-300",
          blur: "from-amber-600 via-orange-500 to-amber-700",
          popoverBg: "from-orange-50 via-amber-50 to-orange-100 dark:from-orange-950 dark:via-amber-950 dark:to-orange-900",
          popoverBorder: "border-orange-400",
          iconColor: "text-orange-600 dark:text-orange-300 fill-orange-600 dark:fill-orange-300",
          textColor: "text-orange-700 dark:text-orange-200",
          cardBorder: "border-orange-300 dark:border-orange-600"
        };
      case 4:
        return {
          gradient: "from-emerald-400 via-emerald-500 to-emerald-600",
          border: "border-emerald-300",
          blur: "from-emerald-400 via-emerald-500 to-emerald-600",
          popoverBg: "from-emerald-50 via-emerald-100 to-emerald-200 dark:from-emerald-950 dark:via-emerald-900 dark:to-emerald-950",
          popoverBorder: "border-emerald-400",
          iconColor: "text-emerald-600 dark:text-emerald-300 fill-emerald-600 dark:fill-emerald-300",
          textColor: "text-emerald-700 dark:text-emerald-200",
          cardBorder: "border-emerald-300 dark:border-emerald-600"
        };
      case 5:
        return {
          gradient: "from-blue-400 via-blue-500 to-blue-600",
          border: "border-blue-300",
          blur: "from-blue-400 via-blue-500 to-blue-600",
          popoverBg: "from-blue-50 via-blue-100 to-blue-200 dark:from-blue-950 dark:via-blue-900 dark:to-blue-950",
          popoverBorder: "border-blue-400",
          iconColor: "text-blue-600 dark:text-blue-300 fill-blue-600 dark:fill-blue-300",
          textColor: "text-blue-700 dark:text-blue-200",
          cardBorder: "border-blue-300 dark:border-blue-600"
        };
      case 6:
        return {
          gradient: "from-purple-400 via-purple-500 to-purple-600",
          border: "border-purple-300",
          blur: "from-purple-400 via-purple-500 to-purple-600",
          popoverBg: "from-purple-50 via-purple-100 to-purple-200 dark:from-purple-950 dark:via-purple-900 dark:to-purple-950",
          popoverBorder: "border-purple-400",
          iconColor: "text-purple-600 dark:text-purple-300 fill-purple-600 dark:fill-purple-300",
          textColor: "text-purple-700 dark:text-purple-200",
          cardBorder: "border-purple-300 dark:border-purple-600"
        };
      case 7:
        return {
          gradient: "from-pink-400 via-pink-500 to-pink-600",
          border: "border-pink-300",
          blur: "from-pink-400 via-pink-500 to-pink-600",
          popoverBg: "from-pink-50 via-pink-100 to-pink-200 dark:from-pink-950 dark:via-pink-900 dark:to-pink-950",
          popoverBorder: "border-pink-400",
          iconColor: "text-pink-600 dark:text-pink-300 fill-pink-600 dark:fill-pink-300",
          textColor: "text-pink-700 dark:text-pink-200",
          cardBorder: "border-pink-300 dark:border-pink-600"
        };
      case 8:
        return {
          gradient: "from-indigo-400 via-indigo-500 to-indigo-600",
          border: "border-indigo-300",
          blur: "from-indigo-400 via-indigo-500 to-indigo-600",
          popoverBg: "from-indigo-50 via-indigo-100 to-indigo-200 dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-950",
          popoverBorder: "border-indigo-400",
          iconColor: "text-indigo-600 dark:text-indigo-300 fill-indigo-600 dark:fill-indigo-300",
          textColor: "text-indigo-700 dark:text-indigo-200",
          cardBorder: "border-indigo-300 dark:border-indigo-600"
        };
      case 9:
        return {
          gradient: "from-cyan-400 via-cyan-500 to-cyan-600",
          border: "border-cyan-300",
          blur: "from-cyan-400 via-cyan-500 to-cyan-600",
          popoverBg: "from-cyan-50 via-cyan-100 to-cyan-200 dark:from-cyan-950 dark:via-cyan-900 dark:to-cyan-950",
          popoverBorder: "border-cyan-400",
          iconColor: "text-cyan-600 dark:text-cyan-300 fill-cyan-600 dark:fill-cyan-300",
          textColor: "text-cyan-700 dark:text-cyan-200",
          cardBorder: "border-cyan-300 dark:border-cyan-600"
        };
      case 10:
        return {
          gradient: "from-teal-400 via-teal-500 to-teal-600",
          border: "border-teal-300",
          blur: "from-teal-400 via-teal-500 to-teal-600",
          popoverBg: "from-teal-50 via-teal-100 to-teal-200 dark:from-teal-950 dark:via-teal-900 dark:to-teal-950",
          popoverBorder: "border-teal-400",
          iconColor: "text-teal-600 dark:text-teal-300 fill-teal-600 dark:fill-teal-300",
          textColor: "text-teal-700 dark:text-teal-200",
          cardBorder: "border-teal-300 dark:border-teal-600"
        };
      default:
        return {
          gradient: "from-slate-400 via-slate-500 to-slate-600",
          border: "border-slate-300",
          blur: "from-slate-400 via-slate-500 to-slate-600",
          popoverBg: "from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950",
          popoverBorder: "border-slate-400",
          iconColor: "text-slate-600 dark:text-slate-300 fill-slate-600 dark:fill-slate-300",
          textColor: "text-slate-700 dark:text-slate-200",
          cardBorder: "border-slate-300 dark:border-slate-600"
        };
    }
  };
  
  const styles = getRankStyles(topRank);
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "👑";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      case 4:
        return "💎";
      case 5:
        return "⭐";
      case 6:
        return "🌟";
      case 7:
        return "✨";
      case 8:
        return "💫";
      case 9:
        return "🔥";
      case 10:
        return "🎖️";
      default:
        return "🏆";
    }
  };
  
  const getCategoryTitle = (category: string) => {
    if (category === 'holder') return "Giữ CAMLY";
    if (category === 'receiver') return "Nhận CAMLY";
    if (category === 'sender') return "Chuyển CAMLY";
    return "";
  };

  const getRankTitle = (rank: number) => {
    if (rank === 1) return "Quán quân";
    if (rank === 2) return "Á vua";
    if (rank === 3) return "Á quân";
    return "";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center justify-center group">
          <div className="relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${styles.blur} rounded-full blur-md opacity-60 group-hover:opacity-80 transition-opacity`} />
            <Badge 
              className={`relative bg-gradient-to-br ${styles.gradient} text-white border-2 ${styles.border} shadow-xl ${sizeClasses[size]} px-3 py-1.5 font-extrabold hover:scale-105 transition-all duration-300 cursor-pointer flex items-center gap-1.5`}
            >
              <Crown className={`${sizeClasses[size]} fill-white drop-shadow-lg`} />
              <span className="drop-shadow-md">
                TOP {topRank}
                {hasSeasonChampion && champions[0].rank === 1 && (
                  <> • Mùa {champions[0].season_number}</>
                )}
              </span>
            </Badge>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className={`w-72 p-4 bg-gradient-to-br ${styles.popoverBg} border-2 ${styles.popoverBorder} shadow-2xl`}>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 pb-3 border-b-2 border-current/30">
            <Crown className={`h-6 w-6 ${styles.iconColor}`} />
            <span className={`font-extrabold text-base ${styles.textColor} drop-shadow`}>
              Thành tích Top {topRank}
              {hasSeasonChampion && champions[0].rank === 1 && (
                <> • {getRankTitle(champions[0].rank)} Mùa {champions[0].season_number}</>
              )}
            </span>
          </div>
          <div className="space-y-2.5">
            {categories.map((item, index) => (
              <div 
                key={index}
                className={`flex items-center gap-3 text-sm bg-white dark:bg-gray-800/80 rounded-xl p-3 border-2 ${styles.cardBorder} shadow-md hover:shadow-lg transition-shadow`}
              >
                <span className="text-2xl">{getRankIcon(item.rank)}</span>
                <div className="flex-1">
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{item.category}</span>
                  <div className={`text-xs ${styles.textColor} font-bold`}>Hạng #{item.rank}</div>
                </div>
              </div>
            ))}
          </div>
          {hasSeasonChampion && (
            <div className="space-y-2 pt-2 border-t-2 border-current/30">
              <p className={`text-xs font-bold ${styles.textColor} text-center`}>
                🏆 Danh hiệu mùa giải 🏆
              </p>
              {champions.slice(0, 3).map((champion, index) => (
                <div
                  key={index}
                  className={`text-xs bg-white dark:bg-gray-800/80 rounded-lg p-2 border ${styles.cardBorder}`}
                >
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {getRankTitle(champion.rank)} • Mùa {champion.season_number}
                  </span>
                  <div className={`text-[10px] ${styles.textColor}`}>
                    {getCategoryTitle(champion.category)}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-center pt-2 border-t-2 border-current/30">
            <p className={`text-xs font-semibold ${styles.textColor}`}>
              ✨ Top {topRank} bảng xếp hạng ✨
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
