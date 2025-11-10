import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, TrendingUp, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GroupRewardsProps {
  userId: string;
  groupId: string;
}

interface GameScore {
  id: string;
  score: number;
  game_type: string;
  created_at: string;
}

const GroupRewards = ({ userId, groupId }: GroupRewardsProps) => {
  const [scores, setScores] = useState<GameScore[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [claimedPoints, setClaimedPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchScores();
  }, [userId, groupId]);

  const fetchScores = async () => {
    try {
      // Fetch game scores
      const { data: scoresData, error: scoresError } = await supabase
        .from("game_scores")
        .select("*")
        .eq("user_id", userId)
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (scoresError) throw scoresError;

      setScores(scoresData || []);
      
      // Calculate total points
      const total = (scoresData || []).reduce((sum, score) => sum + score.score, 0);
      setTotalPoints(total);

      // Get claimed points (from wallet)
      const { data: wallet } = await supabase
        .from("user_wallets")
        .select("camly_balance")
        .eq("user_id", userId)
        .maybeSingle();

      setClaimedPoints(wallet?.camly_balance || 0);
    } catch (error) {
      console.error("Error fetching scores:", error);
    }
  };

  const claimRewards = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Convert game points to F.U tokens (1 point = 1 F.U)
      const unclaimedPoints = totalPoints - claimedPoints;
      
      if (unclaimedPoints <= 0) {
        toast({
          title: "Không có phần thưởng",
          description: "Bạn đã nhận hết phần thưởng hoặc chưa có điểm nào.",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('claim-reward', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: {
          amount: unclaimedPoints,
          rewardType: 'game_reward',
          description: `Nhận thưởng từ minigame trong nhóm`
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Nhận thưởng thành công! 🎉",
          description: `Bạn đã nhận ${unclaimedPoints} F.U Token`,
        });
        
        // Refresh data
        await fetchScores();
      } else {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể nhận thưởng",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getGameIcon = (gameType: string) => {
    switch (gameType) {
      case "spin_wheel":
        return "🎰";
      case "word_puzzle":
        return "🧩";
      default:
        return "🎮";
    }
  };

  const getGameName = (gameType: string) => {
    switch (gameType) {
      case "spin_wheel":
        return "Vòng Quay";
      case "word_puzzle":
        return "Ghép Từ";
      default:
        return "Game";
    }
  };

  const unclaimedPoints = totalPoints - claimedPoints;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Phần thưởng từ Minigame
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-1 text-primary mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-lg font-bold">{totalPoints}</span>
            </div>
            <p className="text-xs text-muted-foreground">Tổng điểm</p>
          </div>
          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-1 text-accent mb-1">
              <Coins className="h-4 w-4" />
              <span className="text-lg font-bold">{claimedPoints}</span>
            </div>
            <p className="text-xs text-muted-foreground">Đã nhận</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/20">
            <div className="flex items-center gap-1 text-yellow-500 mb-1">
              <Gift className="h-4 w-4" />
              <span className="text-lg font-bold">{unclaimedPoints}</span>
            </div>
            <p className="text-xs text-muted-foreground">Chưa nhận</p>
          </div>
        </div>

        {/* Claim Button */}
        {unclaimedPoints > 0 && (
          <Button 
            onClick={claimRewards} 
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-accent"
          >
            <Gift className="mr-2 h-4 w-4" />
            Nhận {unclaimedPoints} F.U Token
          </Button>
        )}

        {/* Recent Scores */}
        <div>
          <h4 className="font-semibold mb-3 text-sm">Lịch sử gần đây</h4>
          {scores.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">Chưa có điểm nào</p>
              <p className="text-xs mt-1">Hãy chơi minigame để nhận điểm!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {scores.slice(0, 10).map((score) => (
                <div
                  key={score.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="text-xl flex-shrink-0">
                    {getGameIcon(score.game_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{getGameName(score.game_type)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(score.created_at).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-bold flex-shrink-0">
                    +{score.score}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupRewards;
