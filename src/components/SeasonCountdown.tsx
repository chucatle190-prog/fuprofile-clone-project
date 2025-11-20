import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Timer, Trophy } from "lucide-react";

const SeasonCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [currentSeason, setCurrentSeason] = useState(1);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      
      // Calculate current season (weeks since 2025-01-01)
      const seasonStart = new Date('2025-01-01');
      const weeksSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
      setCurrentSeason(weeksSinceStart + 1);

      // Find next Sunday at 23:59:59
      const nextSunday = new Date(now);
      nextSunday.setDate(now.getDate() + (7 - now.getDay()));
      nextSunday.setHours(23, 59, 59, 999);

      const difference = nextSunday.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-pulse" />
            <h3 className="font-bold text-sm text-foreground">Mùa {currentSeason}</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Timer className="w-4 h-4" />
            <span>Thời gian còn lại</span>
          </div>
        </div>

        {/* Countdown */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-2 text-center">
            <div className="text-2xl font-black text-yellow-600 dark:text-yellow-400 tabular-nums">
              {timeLeft.days}
            </div>
            <div className="text-[10px] font-medium text-muted-foreground uppercase">
              Ngày
            </div>
          </div>
          
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-2 text-center">
            <div className="text-2xl font-black text-yellow-600 dark:text-yellow-400 tabular-nums">
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <div className="text-[10px] font-medium text-muted-foreground uppercase">
              Giờ
            </div>
          </div>
          
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-2 text-center">
            <div className="text-2xl font-black text-yellow-600 dark:text-yellow-400 tabular-nums">
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <div className="text-[10px] font-medium text-muted-foreground uppercase">
              Phút
            </div>
          </div>
          
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-2 text-center">
            <div className="text-2xl font-black text-yellow-600 dark:text-yellow-400 tabular-nums animate-pulse">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <div className="text-[10px] font-medium text-muted-foreground uppercase">
              Giây
            </div>
          </div>
        </div>

        {/* Message */}
        <p className="text-xs text-center text-muted-foreground font-medium">
          Danh hiệu sẽ được trao vào cuối tuần 🏆
        </p>
      </div>
    </Card>
  );
};

export default SeasonCountdown;