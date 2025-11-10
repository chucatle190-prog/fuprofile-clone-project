import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, Clock, RefreshCw } from "lucide-react";

interface MemoryMatchProps {
  groupId: string;
}

interface CardType {
  id: number;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const LEVELS = [
  { level: 1, gridSize: 6, time: 30, label: "Dễ (6x6)" },
  { level: 2, gridSize: 12, time: 60, label: "Trung bình (12x12)" },
  { level: 3, gridSize: 24, time: 120, label: "Khó (24x24)" },
  { level: 4, gridSize: 48, time: 300, label: "Rất khó (48x48)" },
  { level: 5, gridSize: 64, time: 600, label: "Cực khó (64x64)" },
];

const COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
  "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B88B", "#AFD275",
  "#FF8C94", "#9ED2C6", "#FFB6B9", "#BBDED6", "#61C0BF",
  "#FFAAA5", "#FFD3B6", "#DCEDC1", "#A8E6CF", "#FFE156",
  "#FF6F91", "#FFC75F", "#C9EEFF", "#F67280", "#6C5CE7",
  "#00B894", "#FDCB6E", "#E17055", "#74B9FF", "#A29BFE",
  "#FD79A8", "#FDCB9B", "#55EFC4", "#81ECEC", "#FAB1A0"
];

export default function MemoryMatch({ groupId }: MemoryMatchProps) {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(LEVELS[0].time);
  const [isPlaying, setIsPlaying] = useState(false);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const level = LEVELS[currentLevel - 1];
  const totalPairs = (level.gridSize * level.gridSize) / 2;

  useEffect(() => {
    if (isPlaying && timeLeft > 0 && matchedPairs < totalPairs) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isPlaying) {
      gameOver(false);
    }
  }, [timeLeft, isPlaying, matchedPairs, totalPairs]);

  const initializeGame = () => {
    const totalCards = level.gridSize * level.gridSize;
    const pairs = totalCards / 2;
    
    const gameColors = COLORS.slice(0, Math.min(pairs, COLORS.length));
    const cardColors = [...gameColors, ...gameColors];
    
    // Shuffle
    for (let i = cardColors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardColors[i], cardColors[j]] = [cardColors[j], cardColors[i]];
    }

    const newCards: CardType[] = cardColors.map((color, index) => ({
      id: index,
      color,
      isFlipped: false,
      isMatched: false,
    }));

    setCards(newCards);
    setFlippedIndices([]);
    setMatchedPairs(0);
    setTimeLeft(level.time);
    setIsPlaying(true);
    setIsChecking(false);
  };

  const handleCardClick = (index: number) => {
    if (
      !isPlaying ||
      isChecking ||
      cards[index].isFlipped ||
      cards[index].isMatched ||
      flippedIndices.length >= 2
    ) {
      return;
    }

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsChecking(true);
      checkMatch(newFlipped);
    }
  };

  const checkMatch = (indices: number[]) => {
    const [first, second] = indices;
    
    setTimeout(() => {
      const newCards = [...cards];
      
      if (cards[first].color === cards[second].color) {
        // Match!
        newCards[first].isMatched = true;
        newCards[second].isMatched = true;
        setMatchedPairs(prev => {
          const newMatched = prev + 1;
          if (newMatched === totalPairs) {
            gameOver(true);
          }
          return newMatched;
        });
      } else {
        // No match
        newCards[first].isFlipped = false;
        newCards[second].isFlipped = false;
      }
      
      setCards(newCards);
      setFlippedIndices([]);
      setIsChecking(false);
    }, 600);
  };

  const gameOver = async (won: boolean) => {
    setIsPlaying(false);
    
    if (won) {
      toast.success(`🎉 Hoàn thành màn ${currentLevel}!`);
      await saveScore();
      
      if (currentLevel < LEVELS.length) {
        setTimeout(() => {
          if (confirm(`Chúc mừng! Bạn muốn chơi màn ${currentLevel + 1}?`)) {
            setCurrentLevel(currentLevel + 1);
            setTimeout(initializeGame, 100);
          }
        }, 500);
      } else {
        toast.success("🏆 Chúc mừng! Bạn đã hoàn thành tất cả các màn!");
      }
    } else {
      toast.error("⏰ Hết thời gian!");
    }
  };

  const saveScore = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingScore } = await supabase
        .from("game_scores")
        .select("*")
        .eq("user_id", user.id)
        .eq("group_id", groupId)
        .eq("game_type", "memory_match")
        .single();

      const points = 500;

      if (existingScore) {
        await supabase
          .from("game_scores")
          .update({
            score: existingScore.score + points,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingScore.id);
      } else {
        await supabase.from("game_scores").insert({
          user_id: user.id,
          group_id: groupId,
          game_type: "memory_match",
          score: points,
        });
      }

      await supabase.from("group_notifications").insert({
        user_id: user.id,
        group_id: groupId,
        type: "game",
        content: `Hoàn thành màn ${currentLevel} Memory Match và nhận được ${points} điểm!`,
        related_id: groupId,
      });

      toast.success(`+${points} điểm! 🎉`);
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGridCols = () => {
    if (level.gridSize === 6) return "grid-cols-6";
    if (level.gridSize === 12) return "grid-cols-12";
    if (level.gridSize === 24) return "grid-cols-12 lg:grid-cols-24";
    if (level.gridSize === 48) return "grid-cols-12 lg:grid-cols-24";
    return "grid-cols-12 lg:grid-cols-24";
  };

  const getCardSize = () => {
    if (level.gridSize <= 6) return "h-20 w-20";
    if (level.gridSize <= 12) return "h-12 w-12 md:h-16 md:w-16";
    if (level.gridSize <= 24) return "h-8 w-8 md:h-10 md:w-10";
    if (level.gridSize <= 48) return "h-6 w-6 md:h-8 md:w-8";
    return "h-4 w-4 md:h-6 md:w-6";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🧠 Ghép hình giống nhau</span>
          <Trophy className="h-5 w-5 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level Selection */}
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((lvl) => (
            <Button
              key={lvl.level}
              variant={currentLevel === lvl.level ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setCurrentLevel(lvl.level);
                setIsPlaying(false);
              }}
              disabled={isPlaying}
            >
              Màn {lvl.level}
            </Button>
          ))}
        </div>

        {/* Game Info */}
        <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Màn chơi</p>
            <p className="font-bold">{level.label}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Thời gian</p>
            <p className="font-bold flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tiến độ</p>
            <p className="font-bold">{matchedPairs}/{totalPairs} cặp</p>
          </div>
        </div>

        {/* Start/Reset Button */}
        {!isPlaying && (
          <Button onClick={initializeGame} className="w-full" size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            {cards.length > 0 ? "Chơi lại" : "Bắt đầu"}
          </Button>
        )}

        {/* Game Board */}
        {cards.length > 0 && (
          <div className="overflow-auto max-h-[600px]">
            <div className={`grid ${getGridCols()} gap-1 md:gap-2`}>
              {cards.map((card, index) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(index)}
                  disabled={!isPlaying || card.isMatched}
                  className={`${getCardSize()} rounded-lg transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed`}
                  style={{
                    backgroundColor: card.isFlipped || card.isMatched ? card.color : "#E5E7EB",
                    opacity: card.isMatched ? 0.5 : 1,
                  }}
                >
                  {card.isMatched && (
                    <span className="text-xs md:text-sm">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>🎯 Quy tắc:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Tìm các cặp hình giống màu</li>
            <li>Hoàn thành trong thời gian quy định</li>
            <li>Thắng nhận 500 điểm</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
