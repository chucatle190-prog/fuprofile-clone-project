import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { toast } from "sonner";
import { Bitcoin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PRIZES = [
  { id: 1, value: 1, color: "#FFD700", label: "1 BTC" },
  { id: 2, value: 5, color: "#FF6B6B", label: "5 BTC" },
  { id: 3, value: 10, color: "#4ECDC4", label: "10 BTC" },
  { id: 4, value: 50, color: "#95E1D3", label: "50 BTC" },
  { id: 5, value: 100, color: "#F38181", label: "100 BTC 🎉" },
];

interface SpinWheelProps {
  groupId: string;
}

const SpinWheel = ({ groupId }: SpinWheelProps) => {
  const { user } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);

  const spinWheel = async () => {
    if (spinning || !user) return;

    setSpinning(true);
    setResult(null);

    // Random prize
    const randomIndex = Math.floor(Math.random() * PRIZES.length);
    const prize = PRIZES[randomIndex];

    // Calculate rotation (72 degrees per segment for 5 segments)
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

      toast.success(`🎉 Chúc mừng! Bạn trúng ${prize.label}!`, {
        duration: 5000,
      });
    }, 4000);
  };

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold flex items-center justify-center gap-2 mb-2">
          <Bitcoin className="h-6 w-6 text-yellow-500" />
          Vòng Quay Trúng Thưởng
        </h3>
        <p className="text-muted-foreground">Quay để nhận Bitcoin!</p>
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* Wheel */}
        <div className="relative w-72 h-72">
          <svg
            className="w-full h-full transition-transform duration-[4000ms] ease-out"
            style={{
              transform: `rotate(${rotation}deg)`,
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
