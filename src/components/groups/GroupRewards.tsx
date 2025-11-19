import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Coins, Wallet, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFUToken } from "@/hooks/useFUToken";
import { FU_TOKEN_CONFIG } from "@/config/gameConfig";
import TokenAnimation from "@/components/TokenAnimation";

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
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [showTokenAnimation, setShowTokenAnimation] = useState(false);
  const [tokenAnimAmount, setTokenAnimAmount] = useState(0);
  const [tokenAnimType, setTokenAnimType] = useState<'receive' | 'send' | 'import' | 'transfer'>('receive');
  const { toast } = useToast();
  const { account, connectWallet, isConnecting, addFUTokenToWallet } = useFUToken();

  useEffect(() => {
    fetchScores();
    fetchWalletAddress();
  }, [userId, groupId]);

  useEffect(() => {
    if (account) {
      updateWalletAddress(account);
    }
  }, [account]);

  const fetchWalletAddress = async () => {
    try {
      const { data: wallet } = await supabase
        .from("user_wallets")
        .select("wallet_address")
        .eq("user_id", userId)
        .maybeSingle();

      setWalletAddress(wallet?.wallet_address || null);
    } catch (error) {
      console.error("Error fetching wallet address:", error);
    }
  };

  const updateWalletAddress = async (address: string) => {
    try {
      const { error } = await supabase
        .from("user_wallets")
        .upsert({
          user_id: userId,
          wallet_address: address,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setWalletAddress(address);
      toast({
        title: "Kết nối thành công",
        description: "Ví MetaMask đã được kết nối",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể kết nối ví",
        variant: "destructive",
      });
    }
  };

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

      // Fetch claimed rewards to filter out claimed scores
      const { data: claimedRewards, error: claimedError } = await supabase
        .from("claimed_rewards")
        .select("game_score_id")
        .eq("user_id", userId);

      if (claimedError) throw claimedError;

      const claimedScoreIds = new Set((claimedRewards || []).map(r => r.game_score_id));

      // Filter out claimed scores and only show unclaimed ones
      const unclaimedScores = (scoresData || []).filter(score => !claimedScoreIds.has(score.id));
      
      setScores(unclaimedScores);
      
      // Calculate total unclaimed points
      const total = unclaimedScores.reduce((sum, score) => sum + score.score, 0);
      setTotalPoints(total);

      // Get current wallet balance
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

      // Only claim unclaimed scores
      if (totalPoints <= 0) {
        toast({
          title: "Không có phần thưởng",
          description: "Bạn đã nhận hết phần thưởng hoặc chưa có điểm nào.",
        });
        return;
      }

      // Call edge function to claim rewards
      const { data, error } = await supabase.functions.invoke('claim-reward', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: {
          amount: totalPoints,
          rewardType: 'game_reward',
          description: `Nhận thưởng từ minigame trong nhóm`
        }
      });

      if (error) throw error;

      if (data.success) {
        // Mark all current scores as claimed
        const claimRecords = scores.map(score => ({
          user_id: userId,
          game_score_id: score.id,
          reward_amount: score.score,
        }));

        const { error: claimError } = await supabase
          .from("claimed_rewards")
          .insert(claimRecords);

        if (claimError) {
          console.error("Error marking scores as claimed:", claimError);
        }

        toast({
          title: "Nhận thưởng thành công! 🎉",
          description: `Bạn đã nhận ${totalPoints} Happy Camly`,
        });
        
        // Show animation
        setTokenAnimAmount(totalPoints);
        setTokenAnimType('receive');
        setShowTokenAnimation(true);
        
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

  const importTokenToMetaMask = async () => {
    const success = await addFUTokenToWallet();
    if (success) {
      // Show special animation with token image
      setTokenAnimAmount(0);
      setTokenAnimType('import');
      setShowTokenAnimation(true);
    }
  };
  const handleWithdraw = async () => {
    if (!walletAddress) {
      toast({
        title: "Chưa kết nối ví",
        description: "Vui lòng kết nối ví MetaMask trước",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Số lượng không hợp lệ",
        description: "Vui lòng nhập số lượng Happy Camly muốn rút",
        variant: "destructive",
      });
      return;
    }

    if (amount > claimedPoints) {
      toast({
        title: "Số dư không đủ",
        description: `Bạn chỉ có ${claimedPoints} Happy Camly`,
        variant: "destructive",
      });
      return;
    }

    setWithdrawing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('withdraw-tokens', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: { amount }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Rút Happy Camly thành công! 🎉",
          description: data.message,
        });
        
        // Show animation
        setTokenAnimAmount(amount);
        setTokenAnimType('send');
        setShowTokenAnimation(true);
        setWithdrawAmount("");
        await fetchScores();
      } else {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể rút token",
        variant: "destructive",
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const getGameIcon = (gameType: string) => {
    switch (gameType) {
      case "spin_wheel":
        return "🎰";
      case "word_puzzle":
        return "🧩";
      case "memory_match":
        return "🧠";
      case "princess_rescue":
        return "👑";
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
      case "memory_match":
        return "Ghép Hình";
      case "princess_rescue":
        return "Giải Cứu";
      default:
        return "Game";
    }
  };

  const unclaimedPoints = totalPoints;

  return (
    <>
      <TokenAnimation 
        show={showTokenAnimation}
        amount={tokenAnimAmount}
        type={tokenAnimType}
        onComplete={() => setShowTokenAnimation(false)}
        tokenImage={tokenAnimType === 'import' ? '/assets/happy-camly-coin.jpg' : undefined}
      />
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Phần thưởng từ Minigame
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/20">
            <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 mb-1">
              <Gift className="h-4 w-4" />
              <span className="text-lg font-bold">{unclaimedPoints}</span>
            </div>
            <p className="text-xs text-muted-foreground">Chưa nhận</p>
          </div>
          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-1 text-accent mb-1">
              <Coins className="h-4 w-4" />
              <span className="text-lg font-bold">{claimedPoints}</span>
            </div>
            <p className="text-xs text-muted-foreground">Ví hiện tại</p>
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
            Nhận {unclaimedPoints} Happy Camly
          </Button>
        )}

        {/* MetaMask Connection */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-semibold text-sm">Rút về ví MetaMask</h4>
          
          {!walletAddress ? (
            <Button 
              onClick={connectWallet} 
              disabled={isConnecting}
              className="w-full"
              variant="outline"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {isConnecting ? "Đang kết nối..." : "Kết nối MetaMask"}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground mb-1">Địa chỉ ví</p>
                <p className="font-mono text-sm break-all">{walletAddress}</p>
              </div>

              <Button 
                onClick={importTokenToMetaMask}
                variant="outline"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Import Happy Camly vào MetaMask
              </Button>
              
              <div className="text-xs text-muted-foreground bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">
                  📝 Thông tin token CAMLY
                </p>
                <p>• Mạng: BNB Chain (Mainnet)</p>
                <p>• Symbol: CAMLY</p>
                <p className="break-all">• Contract: 0x0910320181889feFDE0BB1Ca63962b0A8882e413</p>
                <p>• Decimals: 3</p>
              </div>

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Số lượng Camly"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <Button 
                  onClick={handleWithdraw}
                  disabled={withdrawing || !withdrawAmount}
                  className="shrink-0"
                >
                  {withdrawing ? "Đang rút..." : "Rút"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Mạng: BNB Chain | Phí gas: 0.0001 BNB
              </p>
            </div>
          )}
        </div>

        {/* Unclaimed Scores */}
        <div>
          <h4 className="font-semibold mb-3 text-sm">Điểm chưa nhận</h4>
          {scores.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">Không có điểm chưa nhận</p>
              <p className="text-xs mt-1">Hãy chơi minigame để nhận điểm hoặc bạn đã nhận hết phần thưởng!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {scores.slice(0, 10).map((score) => (
                <div
                  key={score.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors"
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
                  <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-bold flex-shrink-0">
                    +{score.score}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </>
  );
};

export default GroupRewards;
