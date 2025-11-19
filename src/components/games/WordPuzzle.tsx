import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { toast } from "sonner";
import { Shuffle, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Puzzle {
  id: number;
  original: string;
  scrambled: string;
}

const PUZZLES: Puzzle[] = [
  { id: 1, original: "Father Universe", scrambled: "" },
  { id: 2, original: "Happy Camly Coin", scrambled: "" },
  { id: 3, original: "Camly Life", scrambled: "" },
];

const shuffleString = (str: string): string => {
  const arr = str.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
};

interface WordPuzzleProps {
  groupId: string;
}

const WordPuzzle = ({ groupId }: WordPuzzleProps) => {
  const { user } = useAuth();
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [completed, setCompleted] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    // Scramble the puzzles on mount
    const scrambled = PUZZLES.map((puzzle) => ({
      ...puzzle,
      scrambled: shuffleString(puzzle.original),
    }));
    setPuzzles(scrambled);
  }, []);

  const handleAnswerChange = (id: number, value: string) => {
    setUserAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const checkAnswer = async (id: number) => {
    const puzzle = puzzles.find((p) => p.id === id);
    const userAnswer = userAnswers[id]?.trim().toLowerCase();
    const correctAnswer = puzzle?.original.toLowerCase();

    if (userAnswer === correctAnswer) {
      setCompleted((prev) => ({ ...prev, [id]: true }));
      
      // Scale rewards: Puzzle 1 = 5000, Puzzle 3 = 25000
      const baseReward = 5000;
      const score = baseReward + ((id - 1) * 10000);

      if (user) {
        // Save score to database
        const { error: scoreError } = await supabase.from("game_scores").insert({
          user_id: user.id,
          group_id: groupId,
          game_type: "word_puzzle",
          score: score,
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
            content: `🧩 đã giải đúng câu đố "${puzzle?.original}" và nhận ${score} điểm!`,
          });

        if (notifError) {
          console.error("Error creating notification:", notifError);
        }
      }

      toast.success(`🎉 Chính xác! Bạn nhận ${score.toLocaleString()} CAMLY!`);
    } else {
      toast.error("❌ Chưa đúng, thử lại nhé!");
    }
  };

  const resetPuzzle = (id: number) => {
    const puzzle = puzzles.find((p) => p.id === id);
    if (puzzle) {
      setPuzzles((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, scrambled: shuffleString(p.original) } : p
        )
      );
      setUserAnswers((prev) => ({ ...prev, [id]: "" }));
      setCompleted((prev) => ({ ...prev, [id]: false }));
    }
  };

  const allCompleted = puzzles.every((p) => completed[p.id]);

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">🧩 Trò Chơi Ghép Chữ</h3>
        <p className="text-muted-foreground">
          Sắp xếp lại các chữ cái để tạo thành từ đúng!
        </p>
      </div>

      <div className="space-y-6">
        {puzzles.map((puzzle) => (
          <div
            key={puzzle.id}
            className={`p-4 border-2 rounded-lg transition-colors ${
              completed[puzzle.id]
                ? "border-green-500 bg-green-50 dark:bg-green-950"
                : "border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                {puzzle.id}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Chữ cái đã xáo trộn:
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {puzzle.scrambled.split("").map((char, index) => (
                      <div
                        key={index}
                        className="w-10 h-10 border-2 border-primary rounded flex items-center justify-center font-bold text-lg bg-primary/5"
                      >
                        {char}
                      </div>
                    ))}
                  </div>
                </div>

                {!completed[puzzle.id] ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={userAnswers[puzzle.id] || ""}
                      onChange={(e) =>
                        handleAnswerChange(puzzle.id, e.target.value)
                      }
                      placeholder="Nhập câu trả lời..."
                      className="w-full px-4 py-2 border-2 border-border rounded-lg focus:outline-none focus:border-primary"
                      disabled={completed[puzzle.id]}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => checkAnswer(puzzle.id)}
                        disabled={!userAnswers[puzzle.id]?.trim()}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Kiểm tra
                      </Button>
                      <Button
                        onClick={() => resetPuzzle(puzzle.id)}
                        variant="outline"
                      >
                        <Shuffle className="h-4 w-4 mr-2" />
                        Xáo lại
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                    <Check className="h-5 w-5" />
                    <span>Chính xác: {puzzle.original}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {allCompleted && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-center">
          <p className="text-xl font-bold">
            🎉 Chúc mừng! Bạn đã hoàn thành tất cả các câu đố!
          </p>
        </div>
      )}
    </Card>
  );
};

export default WordPuzzle;
