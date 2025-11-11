import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Heart, Star, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type CandyType = "red" | "blue" | "green" | "yellow" | "purple" | "obstacle" | "monster";

interface GridCell {
  type: CandyType;
  id: string;
  matched: boolean;
}

interface Level {
  number: number;
  timeLimit: number;
  scoreTarget: number;
  obstacleCount: number;
  monsterCount: number;
}

const levels: Level[] = [
  { number: 1, timeLimit: 300, scoreTarget: 1000, obstacleCount: 3, monsterCount: 0 },
  { number: 2, timeLimit: 240, scoreTarget: 2000, obstacleCount: 5, monsterCount: 1 },
  { number: 3, timeLimit: 200, scoreTarget: 3000, obstacleCount: 7, monsterCount: 2 },
  { number: 4, timeLimit: 180, scoreTarget: 4000, obstacleCount: 9, monsterCount: 3 },
  { number: 5, timeLimit: 150, scoreTarget: 5000, obstacleCount: 12, monsterCount: 4 },
];

const GRID_SIZE = 8;
const candyColors: Record<CandyType, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  purple: "bg-purple-500",
  obstacle: "bg-gray-700",
  monster: "bg-red-900",
};

const candyEmojis: Record<CandyType, string> = {
  red: "🍓",
  blue: "🔷",
  green: "🍏",
  yellow: "⭐",
  purple: "🍇",
  obstacle: "🪨",
  monster: "👹",
};

export const PrincessRescue = ({ 
  onClose,
  groupId,
  userId 
}: { 
  onClose?: () => void;
  groupId?: string;
  userId?: string;
}) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [princePosition, setPrincePosition] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [lives, setLives] = useState(3);
  const { toast } = useToast();

  const level = levels[currentLevel - 1];

  const generateRandomCandy = useCallback((): CandyType => {
    const types: CandyType[] = ["red", "blue", "green", "yellow", "purple"];
    return types[Math.floor(Math.random() * types.length)];
  }, []);

  const initializeGrid = useCallback(() => {
    const newGrid: GridCell[][] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      newGrid[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        newGrid[row][col] = {
          type: generateRandomCandy(),
          id: `${row}-${col}-${Date.now()}`,
          matched: false,
        };
      }
    }

    // Add obstacles
    let obstaclesAdded = 0;
    while (obstaclesAdded < level.obstacleCount) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      if (newGrid[row][col].type !== "obstacle" && newGrid[row][col].type !== "monster") {
        newGrid[row][col].type = "obstacle";
        obstaclesAdded++;
      }
    }

    // Add monsters
    let monstersAdded = 0;
    while (monstersAdded < level.monsterCount) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      if (newGrid[row][col].type !== "obstacle" && newGrid[row][col].type !== "monster") {
        newGrid[row][col].type = "monster";
        monstersAdded++;
      }
    }

    setGrid(newGrid);
  }, [generateRandomCandy, level]);

  useEffect(() => {
    if (gameStarted && !gameWon) {
      initializeGrid();
      setTimeLeft(level.timeLimit);
      setScore(0);
      setLives(3);
      setPrincePosition(0);
    }
  }, [currentLevel, gameStarted, gameWon, initializeGrid, level]);

  useEffect(() => {
    if (!gameStarted || gameWon) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast({
            title: "Hết giờ!",
            description: "Bạn đã hết thời gian. Thử lại nhé!",
            variant: "destructive",
          });
          setGameStarted(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameWon, toast]);

  const checkMatches = useCallback(() => {
    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    let hasMatches = false;
    const matched: { row: number; col: number }[] = [];

    // Check horizontal matches
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        const type = newGrid[row][col].type;
        if (
          type !== "obstacle" &&
          type !== "monster" &&
          newGrid[row][col + 1].type === type &&
          newGrid[row][col + 2].type === type
        ) {
          matched.push({ row, col }, { row, col: col + 1 }, { row, col: col + 2 });
          hasMatches = true;
        }
      }
    }

    // Check vertical matches
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE - 2; row++) {
        const type = newGrid[row][col].type;
        if (
          type !== "obstacle" &&
          type !== "monster" &&
          newGrid[row + 1][col].type === type &&
          newGrid[row + 2][col].type === type
        ) {
          matched.push({ row, col }, { row: row + 1, col }, { row: row + 2, col });
          hasMatches = true;
        }
      }
    }

    if (hasMatches) {
      matched.forEach(({ row, col }) => {
        newGrid[row][col].matched = true;
      });

      setGrid(newGrid);
      setScore((prev) => prev + matched.length * 100);

      setTimeout(() => {
        fillEmptyCells();
      }, 300);
    }

    return hasMatches;
  }, [grid]);

  const fillEmptyCells = useCallback(() => {
    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));

    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        if (newGrid[row][col].matched) {
          // Move cells down
          for (let r = row; r > 0; r--) {
            newGrid[r][col] = newGrid[r - 1][col];
          }
          // Generate new cell at top
          newGrid[0][col] = {
            type: generateRandomCandy(),
            id: `${0}-${col}-${Date.now()}-${Math.random()}`,
            matched: false,
          };
        }
      }
    }

    setGrid(newGrid);
    setTimeout(() => checkMatches(), 100);
  }, [grid, generateRandomCandy, checkMatches]);

  const handleCellClick = (row: number, col: number) => {
    if (grid[row][col].type === "obstacle" || grid[row][col].type === "monster") {
      if (grid[row][col].type === "monster") {
        setLives((prev) => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            toast({
              title: "Thua rồi!",
              description: "Hoàng tử đã bị quái vật đánh bại!",
              variant: "destructive",
            });
            setGameStarted(false);
          } else {
            toast({
              title: "Bị tấn công!",
              description: `Còn ${newLives} mạng`,
              variant: "destructive",
            });
          }
          return newLives;
        });
      }
      return;
    }

    if (!selectedCell) {
      setSelectedCell({ row, col });
    } else {
      const rowDiff = Math.abs(selectedCell.row - row);
      const colDiff = Math.abs(selectedCell.col - col);

      if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
        // Swap cells
        const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
        const temp = newGrid[selectedCell.row][selectedCell.col];
        newGrid[selectedCell.row][selectedCell.col] = newGrid[row][col];
        newGrid[row][col] = temp;

        setGrid(newGrid);
        setSelectedCell(null);

        setTimeout(() => {
          const hasMatches = checkMatches();
          if (!hasMatches) {
            // Swap back if no matches
            const revertGrid = newGrid.map((r) => r.map((c) => ({ ...c })));
            const tempRevert = revertGrid[selectedCell.row][selectedCell.col];
            revertGrid[selectedCell.row][selectedCell.col] = revertGrid[row][col];
            revertGrid[row][col] = tempRevert;
            setGrid(revertGrid);
          }
        }, 100);
      } else {
        setSelectedCell({ row, col });
      }
    }
  };

  useEffect(() => {
    if (score >= level.scoreTarget && gameStarted) {
      if (currentLevel < 5) {
        toast({
          title: "Qua màn!",
          description: `Bạn đã hoàn thành màn ${currentLevel}!`,
        });
        setPrincePosition((prev) => prev + 20);
        setCurrentLevel((prev) => prev + 1);
      } else {
        setGameWon(true);
        
        // Save score to database
        if (groupId && userId) {
          const saveScore = async () => {
            try {
              const { error } = await supabase
                .from("game_scores")
                .insert({
                  user_id: userId,
                  group_id: groupId,
                  game_type: "princess_rescue",
                  score: score,
                });

              if (error) throw error;
            } catch (error) {
              console.error("Error saving score:", error);
            }
          };

          saveScore();
        }
        
        toast({
          title: "Chiến thắng!",
          description: "Hoàng tử đã cứu được công chúa!",
        });
      }
    }
  }, [score, level.scoreTarget, gameStarted, currentLevel, toast, groupId, userId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl">🏰 Giải Cứu Công Chúa</CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!gameStarted && !gameWon && (
          <div className="text-center space-y-4">
            <div className="text-6xl">👑</div>
            <h3 className="text-2xl font-bold">Màn {currentLevel}</h3>
            <p>Giúp hoàng tử vượt qua chướng ngại vật và cứu công chúa!</p>
            <p className="text-sm text-muted-foreground">
              Ghép 3 viên kẹo cùng màu để ghi điểm. Tránh quái vật!
            </p>
            <Button onClick={() => setGameStarted(true)} size="lg">
              Bắt đầu
            </Button>
          </div>
        )}

        {gameWon && (
          <div className="text-center space-y-4">
            <div className="text-6xl">👑💕👸</div>
            <h3 className="text-3xl font-bold text-primary">Chiến Thắng!</h3>
            <p className="text-xl">Hoàng tử đã cứu được công chúa!</p>
            <p className="text-lg">Điểm: {score}</p>
            <Button
              onClick={() => {
                setGameWon(false);
                setGameStarted(false);
                setCurrentLevel(1);
                setScore(0);
              }}
            >
              Chơi lại
            </Button>
          </div>
        )}

        {gameStarted && !gameWon && (
          <>
            {/* Game Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Màn</div>
                <div className="text-xl font-bold">{currentLevel}/5</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Thời gian</div>
                <div className="text-xl font-bold">{formatTime(timeLeft)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Điểm</div>
                <div className="text-xl font-bold">{score}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Mạng</div>
                <div className="text-xl font-bold flex justify-center gap-1">
                  {Array.from({ length: lives }).map((_, i) => (
                    <Heart key={i} className="h-5 w-5 fill-red-500 text-red-500" />
                  ))}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Mục tiêu: {level.scoreTarget}</span>
                <span>{Math.round((score / level.scoreTarget) * 100)}%</span>
              </div>
              <Progress value={(score / level.scoreTarget) * 100} />
            </div>

            {/* Path Progress */}
            <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-between px-4">
                <div
                  className="text-3xl transition-all duration-500"
                  style={{ transform: `translateX(${princePosition * 3.5}px)` }}
                >
                  👑
                </div>
                <div className="text-3xl">👸</div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${princePosition}%` }}
                />
              </div>
            </div>

            {/* Game Grid */}
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}>
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <button
                    key={cell.id}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    disabled={cell.matched}
                    className={`
                      aspect-square rounded-lg transition-all duration-200
                      ${candyColors[cell.type]}
                      ${
                        selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                          ? "ring-4 ring-primary scale-95"
                          : ""
                      }
                      ${cell.matched ? "opacity-0 scale-0" : "opacity-100 scale-100"}
                      ${cell.type === "monster" ? "animate-pulse" : ""}
                      hover:scale-105 disabled:hover:scale-100
                      flex items-center justify-center text-2xl sm:text-3xl
                    `}
                  >
                    {candyEmojis[cell.type]}
                  </button>
                ))
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <div className="flex items-center gap-2">
                <span>🪨</span>
                <span>Chướng ngại vật</span>
              </div>
              <div className="flex items-center gap-2">
                <span>👹</span>
                <span>Quái vật (-1 mạng)</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
