import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { toast } from "sonner";
import { Bitcoin, Wallet, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMetaMask } from "@/hooks/useMetaMask";

const PRIZES = [
  { id: 1, value: 5000, color: "#FFD700", weight: 25, label: "5K CAMLY" },
  { id: 2, value: 20000, color: "#FF6B6B", weight: 20, label: "20K CAMLY" },
  { id: 3, value: 50000, color: "#4ECDC4", weight: 18, label: "50K CAMLY" },
  { id: 4, value: 70000, color: "#95E1D3", weight: 15, label: "70K CAMLY" },
  { id: 5, value: 100000, color: "#F38181", weight: 12, label: "100K CAMLY" },
  { id: 6, value: 200000, color: "#A8E6CF", weight: 9.9, label: "200K CAMLY 🎉" },
  { id: 7, value: 1000000, color: "#FF1493", weight: 0.1, label: "1M CAMLY 💎✨" },
];

interface SpinWheelProps {
  groupId: string;
}

const SpinWheel = ({ groupId }: SpinWheelProps) => {
  const { user } = useAuth();
  const { account, connectWallet } = useMetaMask();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [remainingSpins, setRemainingSpins] = useState<number>(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && groupId) {
      fetchRemainingSpins();
    }
  }, [user, groupId]);

  const fetchRemainingSpins = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_game_spins")
        .select("remaining_spins")
        .eq("user_id", user.id)
        .eq("group_id", groupId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setRemainingSpins(data.remaining_spins);
      } else {
        // Initialize with default 5 spins
        const { error: insertError } = await supabase
          .from("user_game_spins")
          .insert({
            user_id: user.id,
            group_id: groupId,
            remaining_spins: 5,
          });

        if (!insertError) {
          setRemainingSpins(5);
        }
      }
    } catch (error) {
      console.error("Error fetching spins:", error);
    } finally {
      setLoading(false);
    }
  };

  const spinWheel = async () => {
    if (spinning || !user || remainingSpins <= 0) {
      if (remainingSpins <= 0) {
        toast.error("Bạn đã hết lượt quay! Hoàn thành quiz để nhận thêm lượt.");
      }
      return;
    }

    // Update remaining spins first
    const newSpins = remainingSpins - 1;
    const { error: updateError } = await supabase
      .from("user_game_spins")
      .update({ remaining_spins: newSpins })
      .eq("user_id", user.id)
      .eq("group_id", groupId);

    if (updateError) {
      console.error("Error updating spins:", updateError);
      toast.error("Có lỗi xảy ra!");
      return;
    }

    setRemainingSpins(newSpins);
    setSpinning(true);
    setResult(null);

    // Weighted random selection
    const totalWeight = PRIZES.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedPrize = PRIZES[0];
    
    for (const prize of PRIZES) {
      random -= prize.weight;
      if (random <= 0) {
        selectedPrize = prize;
        break;
      }
    }

    const randomIndex = PRIZES.findIndex(p => p.id === selectedPrize.id);
    const prize = selectedPrize;

    // Calculate rotation
    const segmentAngle = 360 / PRIZES.length;
    const targetRotation = 360 * 5 + randomIndex * segmentAngle;

    setRotation(targetRotation);

    setTimeout(async () => {
      setSpinning(false);
      setResult(prize.value);

      // Save score to database
      const { error: scoreError } = await supabase.from("game_scores").insert({
        user_id: user.id,
        group_id: groupId,
        game_type: "spin_wheel",
        score: prize.value,
      });

      if (scoreError) {
        console.error("Error saving score:", scoreError);
      }

      // Update level and experience
      const { data: userLevel } = await supabase
        .from("user_levels")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const newXP = (userLevel?.experience_points || 0) + prize.value;
      const newLevel = Math.floor(newXP / 100) + 1;

      if (userLevel) {
        await supabase
          .from("user_levels")
          .update({
            experience_points: newXP,
            level: newLevel,
          })
          .eq("id", userLevel.id);
      } else {
        await supabase.from("user_levels").insert({
          user_id: user.id,
          experience_points: newXP,
          level: newLevel,
        });
      }

      // Create notification
      const { error: notifError } = await supabase
        .from("group_notifications")
        .insert({
          group_id: groupId,
          user_id: user.id,
          type: "game_score",
          content: `🎉 đã trúng ${prize.value} BTC trong Vòng Quay!`,
        });

      if (notifError) {
        console.error("Error creating notification:", notifError);
      }

      // If connected to MetaMask, show claim option
      if (account) {
        toast.success(
          `🎉 Chúc mừng! Bạn trúng ${prize.label}! Phần thưởng sẽ được gửi đến ví ${account.slice(0, 6)}...${account.slice(-4)}`,
          { duration: 5000 }
        );
      } else {
        toast.success(`🎉 Chúc mừng! Bạn trúng ${prize.label}!`, {
          duration: 5000,
        });
      }
    }, 4000);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center">Đang tải...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold flex items-center justify-center gap-2 mb-2">
          <Bitcoin className="h-6 w-6 text-yellow-500" />
          Vòng Quay Trúng Thưởng
        </h3>
        <p className="text-muted-foreground">Quay để nhận Bitcoin!</p>

        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
            <Ticket className="h-5 w-5 text-primary" />
            <span className="font-bold">{remainingSpins} lượt còn lại</span>
          </div>

          {!account ? (
            <Button onClick={connectWallet} variant="outline" size="sm">
              <Wallet className="h-4 w-4 mr-2" />
              Kết nối MetaMask
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground">
              <Wallet className="h-4 w-4 inline mr-1" />
              {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* Wheel */}
        <div className="relative w-72 h-72">
          <svg
            className="w-full h-full"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
            }}
            viewBox="0 0 200 200"
          >
            {PRIZES.map((prize, index) => {
              const angle = (360 / PRIZES.length) * index;
              const nextAngle = (360 / PRIZES.length) * (index + 1);
              const midAngle = (angle + nextAngle) / 2;

              // Calculate path for each segment
              const startX = 100 + 90 * Math.cos((angle * Math.PI) / 180);
              const startY = 100 + 90 * Math.sin((angle * Math.PI) / 180);
              const endX = 100 + 90 * Math.cos((nextAngle * Math.PI) / 180);
              const endY = 100 + 90 * Math.sin((nextAngle * Math.PI) / 180);

              // Text position
              const textX = 100 + 60 * Math.cos((midAngle * Math.PI) / 180);
              const textY = 100 + 60 * Math.sin((midAngle * Math.PI) / 180);

              return (
                <g key={prize.id}>
                  <path
                    d={`M 100 100 L ${startX} ${startY} A 90 90 0 0 1 ${endX} ${endY} Z`}
                    fill={prize.color}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontWeight="bold"
                    fontSize="12"
                    transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                  >
                    {prize.label}
                  </text>
                </g>
              );
            })}
            {/* Center circle */}
            <circle cx="100" cy="100" r="20" fill="white" stroke="#333" strokeWidth="2" />
          </svg>

          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-red-500" />
          </div>
        </div>

        {/* Result */}
        {result !== null && (
          <div className="text-center p-4 bg-primary/10 rounded-lg border-2 border-primary">
            <p className="text-lg font-bold text-primary">
              Bạn đã trúng: {result} BTC!
            </p>
          </div>
        )}

        {/* Spin Button */}
        <Button
          onClick={spinWheel}
          disabled={spinning}
          size="lg"
          className="w-full max-w-xs"
        >
          {spinning ? "Đang quay..." : "Quay ngay!"}
        </Button>
      </div>
    </Card>
  );
};

export default SpinWheel;
