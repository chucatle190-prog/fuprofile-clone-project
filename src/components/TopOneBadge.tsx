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
  
  const sizeClasses = {
    sm: "h-4 w-4 text-[10px]",
    md: "h-5 w-5 text-xs",
    lg: "h-6 w-6 text-sm"
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center justify-center group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 rounded-full blur-md opacity-60 group-hover:opacity-80 transition-opacity" />
            <Badge 
              className={`relative bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 text-white border-2 border-yellow-300 shadow-xl ${sizeClasses[size]} px-3 py-1.5 font-extrabold hover:scale-105 transition-all duration-300 cursor-pointer flex items-center gap-1.5`}
            >
              <Crown className={`${sizeClasses[size]} fill-white drop-shadow-lg`} />
              <span className="drop-shadow-md">TOP 1</span>
            </Badge>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 dark:from-yellow-950 dark:via-amber-950 dark:to-yellow-900 border-2 border-yellow-400 shadow-2xl">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 pb-3 border-b-2 border-yellow-400/30">
            <Crown className="h-6 w-6 text-yellow-600 dark:text-yellow-300 fill-yellow-600 dark:fill-yellow-300" />
            <span className="font-extrabold text-base text-yellow-700 dark:text-yellow-200 drop-shadow">Thành tích Top 1</span>
          </div>
          <div className="space-y-2.5">
            {categories.map((category, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 text-sm bg-white dark:bg-gray-800/80 rounded-xl p-3 border-2 border-yellow-300 dark:border-yellow-600 shadow-md hover:shadow-lg transition-shadow"
              >
                <span className="text-2xl">🏆</span>
                <span className="font-semibold text-gray-800 dark:text-gray-100">{category}</span>
              </div>
            ))}
          </div>
          <div className="text-center pt-2 border-t-2 border-yellow-400/30">
            <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
              ✨ Người dẫn đầu bảng xếp hạng ✨
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
