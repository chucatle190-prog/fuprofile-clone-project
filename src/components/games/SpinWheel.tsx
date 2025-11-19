import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { toast } from "sonner";
import { Bitcoin, Wallet, Ticket, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMetaMask } from "@/hooks/useMetaMask";
import { Confetti } from "./Confetti";

const PRIZES = [
  { id: 1, value: 20000, color: "#FFD700", weight: 30, label: "20K" },
  { id: 2, value: 50000, color: "#4ECDC4", weight: 25, label: "50K" },
  { id: 3, value: 70000, color: "#FF6B6B", weight: 20, label: "70K" },
  { id: 4, value: 100000, color: "#95E1D3", weight: 15, label: "100K" },
  { id: 5, value: 200000, color: "#F38181", weight: 9.9, label: "200K" },
  { id: 6, value: 1000000, color: "#FF1493", weight: 0.1, label: "1M 💎" },
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [isJackpot, setIsJackpot] = useState(false);

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

    const prizeIndex = PRIZES.findIndex(p => p.id === selectedPrize.id);
    const prize = selectedPrize;

    // Calculate rotation with proper normalization
    const segmentAngle = 360 / PRIZES.length;
    
    // Normalize current rotation to 0-360 range
    const normalizedRotation = rotation % 360;
    
    // Calculate target angle - aim for center of the segment
    // The pointer is at the top, so we need to rotate to align the prize center with the top
    const segmentCenter = prizeIndex * segmentAngle + segmentAngle / 2;
    
    // Add small random offset within segment for natural feel
    const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.2);
    
    // Calculate target with 5 full rotations + precise landing
    const targetAngle = segmentCenter + randomOffset;
    const fullRotations = 360 * 5;
    
    // Calculate final rotation from normalized position
    const finalRotation = normalizedRotation + fullRotations + (targetAngle - normalizedRotation);
    
    setRotation(finalRotation);

    setTimeout(async () => {
      setSpinning(false);
      setResult(prize.value);

      // Check if jackpot
      const isJackpotWin = prize.value === 1000000;
      if (isJackpotWin) {
        setIsJackpot(true);
        setShowConfetti(true);
        
        // Play celebration sound
        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzKM0fPTgjMGHm7A7+OZRA0PVqzn77BdGApKoOTxwGghByyJ0vPYiDUGF2S37OmkUxQKQ5zj8r1rIgcxitL03IoyCx5qwPDmnEYPD1Opw';
        audio.play().catch(() => console.log('Audio play failed'));
      }

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
          content: isJackpotWin 
            ? `🎰💎 TRÚNG ĐẶC BIỆT ${prize.value.toLocaleString()} CAMLY! 🎉✨`
            : `🎉 đã trúng ${prize.value.toLocaleString()} CAMLY trong Vòng Quay!`,
        });

      if (notifError) {
        console.error("Error creating notification:", notifError);
      }

      // Show special toast for jackpot
      if (isJackpotWin) {
        toast.success(
          `🎰💎 CHÚC MỪNG! BẠN TRÚNG ĐẶC BIỆT 1 TRIỆU CAMLY! 🎉✨💰`,
          { 
            duration: 8000,
            className: 'text-lg font-bold'
          }
        );
      } else if (account) {
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
    <>
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      <Card className="p-6 relative overflow-hidden">
        {isJackpot && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-pink-500/20 to-purple-600/20 animate-pulse pointer-events-none" />
        )}
        
        <div className="text-center mb-6 relative z-10">
          <h3 className="text-2xl font-bold flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            Vòng Quay Trúng Thưởng
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </h3>
          <p className="text-muted-foreground">Quay để nhận Happy Camly Coin!</p>

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

        <div className="flex flex-col items-center gap-6 relative z-10">
          {/* Wheel */}
          <div className={`relative w-80 h-80 ${isJackpot ? 'animate-pulse' : ''}`}>
            <svg
              className={`w-full h-full drop-shadow-2xl ${spinning ? 'filter blur-[1px]' : ''}`}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
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
                      strokeWidth="3"
                      className="drop-shadow-md"
                    />
                    <text
                      x={textX}
                      y={textY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontWeight="bold"
                      fontSize="10"
                      stroke="#000"
                      strokeWidth="0.5"
                      transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                    >
                      {prize.label}
                    </text>
                  </g>
                );
              })}
              {/* Center circle with gradient */}
              <defs>
                <radialGradient id="centerGradient">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#FFA500" />
                </radialGradient>
              </defs>
              <circle cx="100" cy="100" r="25" fill="url(#centerGradient)" stroke="#fff" strokeWidth="3" />
              <text
                x="100"
                y="100"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontWeight="bold"
                fontSize="14"
                stroke="#000"
                strokeWidth="0.5"
              >
                SPIN
              </text>
            </svg>

            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-20">
              <div className="relative">
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[35px] border-t-red-600 drop-shadow-lg" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white" />
              </div>
            </div>
          </div>

          {/* Result */}
          {result !== null && (
            <div className={`text-center p-4 rounded-xl border-4 max-w-xs mx-auto ${
              result === 1000000 
                ? 'bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 border-yellow-300 animate-pulse' 
                : 'bg-primary/10 border-primary'
            }`}>
              <p className={`font-bold ${
                result === 1000000 ? 'text-white drop-shadow-lg' : 'text-primary'
              }`}>
                {result === 1000000 ? (
                  <>
                    <span className="text-lg">🎰💎 JACKPOT! 💎🎰</span>
                    <br />
                    <span className="text-3xl">1,000,000</span>
                    <br />
                    <span className="text-base">CAMLY! 🎉✨</span>
                  </>
                ) : (
                  <>
                    <span className="text-base">🎉 Bạn trúng</span>
                    <br />
                    <span className="text-2xl">{result.toLocaleString()} CAMLY!</span>
                  </>
                )}
              </p>
            </div>
          )}

          {/* Spin Button */}
          <Button
            onClick={spinWheel}
            disabled={spinning || remainingSpins === 0}
            size="lg"
            className={`w-full max-w-xs text-lg font-bold ${
              spinning ? 'animate-pulse' : ''
            }`}
          >
            {spinning ? "🎰 Đang quay..." : remainingSpins === 0 ? "Hết lượt quay" : "🎯 Quay ngay!"}
          </Button>
        </div>
      </Card>
    </>
  );
};

export default SpinWheel;
