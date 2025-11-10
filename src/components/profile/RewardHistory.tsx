import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Bitcoin, TrendingUp, Calendar } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface RewardHistoryProps {
  userId: string;
}

interface Reward {
  id: string;
  reward_type: string;
  amount: number;
  description: string;
  created_at: string;
}

interface Stats {
  today: number;
  week: number;
  month: number;
  total: number;
}

const RewardHistory = ({ userId }: RewardHistoryProps) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [stats, setStats] = useState<Stats>({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewards();
  }, [userId]);

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from("reward_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data) {
        setRewards(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error("Error fetching rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (rewardData: Reward[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayRewards = rewardData.filter(
      (r) => new Date(r.created_at) >= today
    );
    const weekRewards = rewardData.filter(
      (r) => new Date(r.created_at) >= weekAgo
    );
    const monthRewards = rewardData.filter(
      (r) => new Date(r.created_at) >= monthAgo
    );

    setStats({
      today: todayRewards.reduce((sum, r) => sum + Number(r.amount), 0),
      week: weekRewards.reduce((sum, r) => sum + Number(r.amount), 0),
      month: monthRewards.reduce((sum, r) => sum + Number(r.amount), 0),
      total: rewardData.reduce((sum, r) => sum + Number(r.amount), 0),
    });
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "daily_task":
        return "✅";
      case "streak_bonus":
        return "🔥";
      case "spin_wheel":
        return "🎰";
      case "game":
        return "🎮";
      default:
        return "💰";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days === 0) {
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} phút trước`;
      }
      return `${hours} giờ trước`;
    } else if (days === 1) {
      return "Hôm qua";
    } else if (days < 7) {
      return `${days} ngày trước`;
    } else {
      return date.toLocaleDateString("vi-VN");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Đang tải...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Lịch sử phần thưởng
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-1 text-yellow-500 mb-1">
              <Bitcoin className="h-4 w-4" />
              <span className="text-lg font-bold">{stats.today}</span>
            </div>
            <p className="text-xs text-muted-foreground">Hôm nay</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-1 text-yellow-500 mb-1">
              <Bitcoin className="h-4 w-4" />
              <span className="text-lg font-bold">{stats.week}</span>
            </div>
            <p className="text-xs text-muted-foreground">7 ngày</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-1 text-yellow-500 mb-1">
              <Bitcoin className="h-4 w-4" />
              <span className="text-lg font-bold">{stats.month}</span>
            </div>
            <p className="text-xs text-muted-foreground">30 ngày</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/20">
            <div className="flex items-center gap-1 text-yellow-500 mb-1">
              <Bitcoin className="h-4 w-4" />
              <span className="text-lg font-bold">{stats.total}</span>
            </div>
            <p className="text-xs text-muted-foreground">Tổng cộng</p>
          </div>
        </div>

        {/* Reward List */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Lịch sử gần đây
          </h4>
          <ScrollArea className="h-[400px] pr-4">
            {rewards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bitcoin className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Chưa có phần thưởng nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="text-2xl flex-shrink-0">
                      {getRewardIcon(reward.reward_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {reward.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(reward.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500 font-bold flex-shrink-0">
                      <Bitcoin className="h-4 w-4" />
                      +{reward.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default RewardHistory;