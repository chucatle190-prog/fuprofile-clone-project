import { Crown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Badge } from "./ui/badge";
import { useTopRankings } from "@/hooks/useTopRankings";

interface TopOneBadgeProps {
  userId: string;
  size?: "sm" | "md" | "lg";
}

export default function TopOneBadge({ userId, size = "md" }: TopOneBadgeProps) {
  const { getTopCategories } = useTopRankings();
  const categories = getTopCategories(userId);
  
  if (categories.length === 0) return null;
  
  // Get the highest rank (lowest number)
  const topRank = Math.min(...categories.map(c => c.rank));
  
  const sizeClasses = {
    sm: "h-4 w-4 text-[10px]",
    md: "h-5 w-5 text-xs",
    lg: "h-6 w-6 text-sm"
  };
  
  const getRankStyles = (rank: number) => {
    if (rank === 1) {
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
    } else if (rank === 2) {
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
    } else if (rank === 3) {
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
    } else {
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
    }
  };
  
  const styles = getRankStyles(topRank);
  
  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🏆";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "⭐";
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
              <span className="drop-shadow-md">TOP {topRank}</span>
            </Badge>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className={`w-72 p-4 bg-gradient-to-br ${styles.popoverBg} border-2 ${styles.popoverBorder} shadow-2xl`}>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 pb-3 border-b-2 border-current/30">
            <Crown className={`h-6 w-6 ${styles.iconColor}`} />
            <span className={`font-extrabold text-base ${styles.textColor} drop-shadow`}>Thành tích Top {topRank}</span>
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
