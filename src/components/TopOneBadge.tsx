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
        <button className="inline-flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 rounded-full blur-sm opacity-75 animate-pulse" />
            <Badge 
              className={`relative bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 text-white border-yellow-300 border-2 ${sizeClasses[size]} px-2 py-1 font-bold shadow-lg hover:scale-110 transition-transform cursor-pointer`}
            >
              <Crown className={`${sizeClasses[size]} mr-1`} />
              TOP 1
            </Badge>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-2 border-yellow-400">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
            <Crown className="h-5 w-5" />
            <span className="font-bold text-sm">Thành tích Top 1</span>
          </div>
          <div className="space-y-2">
            {categories.map((category, index) => (
              <div 
                key={index}
                className="flex items-start gap-2 text-sm bg-white dark:bg-gray-800 rounded-lg p-2 border border-yellow-300"
              >
                <span className="text-yellow-600 dark:text-yellow-400">🏆</span>
                <span className="text-gray-700 dark:text-gray-300">{category}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            ✨ Người dẫn đầu bảng xếp hạng ✨
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
