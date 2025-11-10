import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, Clock, RefreshCw, X } from "lucide-react";
import fairy1 from "@/assets/game/fairy1.jpg";
import fairy2 from "@/assets/game/fairy2.jpg";
import fairy3 from "@/assets/game/fairy3.jpg";
import fairy4 from "@/assets/game/fairy4.jpg";
import fairy5 from "@/assets/game/fairy5.jpg";

interface MemoryMatchProps {
  groupId: string;
}

interface CardType {
  id: number;
  imageUrl: string;
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

const FAIRY_IMAGES = [fairy1, fairy2, fairy3, fairy4, fairy5];

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
    
    // Repeat fairy images as needed to fill all pairs
    const cardImages: string[] = [];
    for (let i = 0; i < pairs; i++) {
      cardImages.push(FAIRY_IMAGES[i % FAIRY_IMAGES.length]);
    }
    
    // Create pairs
    const allCardImages = [...cardImages, ...cardImages];
    
    // Shuffle
    for (let i = allCardImages.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCardImages[i], allCardImages[j]] = [allCardImages[j], allCardImages[i]];
    }

    const newCards: CardType[] = allCardImages.map((imageUrl, index) => ({
      id: index,
      imageUrl,
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
      
      if (cards[first].imageUrl === cards[second].imageUrl) {
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

  const handleExit = () => {
    if (isPlaying && confirm("Bạn có chắc muốn thoát game? Tiến trình sẽ bị mất.")) {
      setIsPlaying(false);
      setCards([]);
      setFlippedIndices([]);
      setMatchedPairs(0);
      setTimeLeft(level.time);
    } else if (!isPlaying) {
      setCards([]);
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
    if (level.gridSize <= 6) return "h-24 w-24 sm:h-28 sm:w-28";
    if (level.gridSize <= 12) return "h-16 w-16 sm:h-20 sm:w-20";
    if (level.gridSize <= 24) return "h-10 w-10 sm:h-12 sm:w-12";
    if (level.gridSize <= 48) return "h-8 w-8 sm:h-10 sm:w-10";
    return "h-6 w-6 sm:h-8 sm:w-8";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span>🧠 Ghép hình giống nhau</span>
          </div>
          {cards.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExit}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
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
        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted p-3 sm:p-4 rounded-lg">
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm text-muted-foreground">Màn chơi</p>
            <p className="font-bold text-sm sm:text-base">{level.label}</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm text-muted-foreground">Thời gian</p>
            <p className="font-bold text-sm sm:text-base flex items-center gap-1 justify-center sm:justify-start">
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm text-muted-foreground">Tiến độ</p>
            <p className="font-bold text-sm sm:text-base">{matchedPairs}/{totalPairs} cặp</p>
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
          <div className="overflow-auto max-h-[500px] sm:max-h-[600px]">
            <div className={`grid ${getGridCols()} gap-2 sm:gap-3 justify-items-center`}>
              {cards.map((card, index) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(index)}
                  disabled={!isPlaying || card.isMatched}
                  className={`${getCardSize()} rounded-lg transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed overflow-hidden relative shadow-sm`}
                >
                  {/* Background image - always visible but blurred when not flipped */}
                  <img 
                    src={card.imageUrl} 
                    alt="Fairy" 
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      card.isFlipped || card.isMatched ? 'blur-0' : 'blur-md'
                    }`}
                    style={{
                      filter: card.isFlipped || card.isMatched ? 'none' : 'blur(8px) brightness(0.7)',
                    }}
                  />
                  
                  {/* Overlay for unflipped cards */}
                  {!card.isFlipped && !card.isMatched && (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/80 to-teal-500/80 flex items-center justify-center backdrop-blur-sm">
                      <span className="text-white text-xl sm:text-2xl font-bold drop-shadow-lg">?</span>
                    </div>
                  )}
                  
                  {/* Matched overlay */}
                  {card.isMatched && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-2xl sm:text-4xl drop-shadow-lg">✓</span>
                    </div>
                  )}
                  
                  {/* Border effect for flipped cards */}
                  {card.isFlipped && !card.isMatched && (
                    <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none" />
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
