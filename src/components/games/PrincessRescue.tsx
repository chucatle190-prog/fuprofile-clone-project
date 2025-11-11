import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Heart, Star, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type CandyType = "red" | "blue" | "green" | "yellow" | "purple" | "rock";

interface GridCell {
  type: CandyType;
  id: string;
  matched: boolean;
  isPath?: boolean;
}

interface Level {
  number: number;
  timeLimit: number;
  movesLimit: number;
  scoreTarget: number;
  rockCount: number;
  pathLength: number;
}

const levels: Level[] = [
  { number: 1, timeLimit: 300, movesLimit: 30, scoreTarget: 1000, rockCount: 5, pathLength: 3 },
  { number: 2, timeLimit: 240, movesLimit: 25, scoreTarget: 2000, rockCount: 8, pathLength: 4 },
  { number: 3, timeLimit: 200, movesLimit: 20, scoreTarget: 3000, rockCount: 12, pathLength: 5 },
  { number: 4, timeLimit: 180, movesLimit: 18, scoreTarget: 4500, rockCount: 15, pathLength: 6 },
  { number: 5, timeLimit: 150, movesLimit: 15, scoreTarget: 6000, rockCount: 20, pathLength: 7 },
];

const GRID_SIZE = 8;
const candyColors: Record<CandyType, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  purple: "bg-purple-500",
  rock: "bg-gray-600",
};

const candyEmojis: Record<CandyType, string> = {
  red: "🍓",
  blue: "🍬",
  green: "🍏",
  yellow: "🌟",
  purple: "🍇",
  rock: "🪨",
};

export const PrincessRescue = ({
  onClose,
  groupId,
  userId,
}: {
  onClose?: () => void;
  groupId?: string;
  userId?: string;
}) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(30);
  const [timeLeft, setTimeLeft] = useState(300);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [pathProgress, setPathProgress] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameLost, setGameLost] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [possibleMoves, setPossibleMoves] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const level = levels[currentLevel - 1];

  const generateRandomCandy = useCallback((): CandyType => {
    const types: CandyType[] = ["red", "blue", "green", "yellow", "purple"];
    return types[Math.floor(Math.random() * types.length)];
  }, []);

  const initializeGrid = useCallback(() => {
    const newGrid: GridCell[][] = [];
    
    // Create basic grid
    for (let row = 0; row < GRID_SIZE; row++) {
      newGrid[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        let type = generateRandomCandy();
        
        // Avoid creating initial matches
        while (
          (col >= 2 && newGrid[row][col - 1].type === type && newGrid[row][col - 2].type === type) ||
          (row >= 2 && newGrid[row - 1][col].type === type && newGrid[row - 2][col].type === type)
        ) {
          type = generateRandomCandy();
        }
        
        newGrid[row][col] = {
          type,
          id: `${row}-${col}-${Date.now()}`,
          matched: false,
          isPath: false,
        };
      }
    }

    // Add rocks (obstacles)
    let rocksAdded = 0;
    while (rocksAdded < level.rockCount) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      if (newGrid[row][col].type !== "rock") {
        newGrid[row][col].type = "rock";
        rocksAdded++;
      }
    }

    // Mark path cells (from top-left moving right and down)
    let pathCells = 0;
    let currentRow = 0;
    let currentCol = 0;
    
    while (pathCells < level.pathLength && currentRow < GRID_SIZE) {
      if (newGrid[currentRow][currentCol].type !== "rock") {
        newGrid[currentRow][currentCol].isPath = true;
        pathCells++;
      }
      
      if (Math.random() > 0.5 && currentCol < GRID_SIZE - 1) {
        currentCol++;
      } else if (currentRow < GRID_SIZE - 1) {
        currentRow++;
      } else if (currentCol < GRID_SIZE - 1) {
        currentCol++;
      }
    }

    setGrid(newGrid);
  }, [generateRandomCandy, level]);

  useEffect(() => {
    if (gameStarted && !gameWon && !gameLost) {
      initializeGrid();
      setTimeLeft(level.timeLimit);
      setMoves(level.movesLimit);
      setScore(0);
      setPathProgress(0);
    }
  }, [currentLevel, gameStarted, gameWon, gameLost, initializeGrid, level]);

  useEffect(() => {
    if (!gameStarted || gameWon || gameLost) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameLost(true);
          toast({
            title: "Hết giờ!",
            description: "Bạn đã hết thời gian.",
            variant: "destructive",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameWon, gameLost, toast]);

  const checkMatches = useCallback(() => {
    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    let hasMatches = false;
    const matched: { row: number; col: number }[] = [];

    // Check horizontal matches
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        const type = newGrid[row][col].type;
        if (
          type !== "rock" &&
          newGrid[row][col + 1].type === type &&
          newGrid[row][col + 2].type === type
        ) {
          let matchLength = 3;
          matched.push({ row, col }, { row, col: col + 1 }, { row, col: col + 2 });
          
          // Check for longer matches
          let checkCol = col + 3;
          while (checkCol < GRID_SIZE && newGrid[row][checkCol].type === type) {
            matched.push({ row, col: checkCol });
            matchLength++;
            checkCol++;
          }
          
          hasMatches = true;
          col += matchLength - 1;
        }
      }
    }

    // Check vertical matches
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE - 2; row++) {
        const type = newGrid[row][col].type;
        if (
          type !== "rock" &&
          newGrid[row + 1][col].type === type &&
          newGrid[row + 2][col].type === type
        ) {
          let matchLength = 3;
          matched.push({ row, col }, { row: row + 1, col }, { row: row + 2, col });
          
          // Check for longer matches
          let checkRow = row + 3;
          while (checkRow < GRID_SIZE && newGrid[checkRow][col].type === type) {
            matched.push({ row: checkRow, col });
            matchLength++;
            checkRow++;
          }
          
          hasMatches = true;
          row += matchLength - 1;
        }
      }
    }

    if (hasMatches) {
      // Mark matched cells
      const uniqueMatched = Array.from(
        new Set(matched.map((m) => `${m.row}-${m.col}`))
      ).map((key) => {
        const [row, col] = key.split("-").map(Number);
        return { row, col };
      });

      uniqueMatched.forEach(({ row, col }) => {
        newGrid[row][col].matched = true;
      });

      setGrid(newGrid);
      const points = uniqueMatched.length * 100;
      setScore((prev) => prev + points);

      // Check if path cells were cleared
      let pathCleared = 0;
      uniqueMatched.forEach(({ row, col }) => {
        if (newGrid[row][col].isPath) {
          pathCleared++;
        }
      });

      if (pathCleared > 0) {
        setPathProgress((prev) => Math.min(prev + pathCleared, level.pathLength));
      }

      setTimeout(() => {
        fillEmptyCells();
      }, 300);
    }

    return hasMatches;
  }, [grid, level.pathLength]);

  const fillEmptyCells = useCallback(() => {
    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));

    for (let col = 0; col < GRID_SIZE; col++) {
      let emptySpaces = 0;
      
      // Count empty spaces from bottom to top
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        if (newGrid[row][col].matched) {
          emptySpaces++;
        } else if (emptySpaces > 0) {
          // Move cell down
          newGrid[row + emptySpaces][col] = { ...newGrid[row][col] };
          newGrid[row][col] = {
            type: generateRandomCandy(),
            id: `${row}-${col}-${Date.now()}-${Math.random()}`,
            matched: false,
            isPath: newGrid[row][col].isPath,
          };
        }
      }
      
      // Fill top cells
      for (let row = 0; row < emptySpaces; row++) {
        newGrid[row][col] = {
          type: generateRandomCandy(),
          id: `${row}-${col}-${Date.now()}-${Math.random()}`,
          matched: false,
          isPath: newGrid[row][col].isPath,
        };
      }
    }

    setGrid(newGrid);
    setTimeout(() => {
      const hasMoreMatches = checkMatches();
      if (!hasMoreMatches) {
        // Check if there are any possible moves
        checkGameOver();
      }
    }, 100);
  }, [grid, generateRandomCandy, checkMatches]);

  const checkGameOver = () => {
    // Simple check - could be more sophisticated
    if (moves <= 0 && score < level.scoreTarget) {
      setGameLost(true);
      toast({
        title: "Thua rồi!",
        description: "Hết nước đi. Thử lại nhé!",
        variant: "destructive",
      });
    }
  };

  const findPossibleMoves = useCallback(() => {
    const moves = new Set<string>();
    
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col].type === "rock") continue;
        
        // Check horizontal swap
        if (col < GRID_SIZE - 1 && grid[row][col + 1].type !== "rock") {
          // Simulate swap right
          const type1 = grid[row][col].type;
          const type2 = grid[row][col + 1].type;
          
          // Check if this swap creates a match
          let createsMatch = false;
          
          // Check horizontal match for first cell after swap
          if (col >= 2 && grid[row][col - 1].type === type2 && grid[row][col - 2].type === type2) createsMatch = true;
          if (col < GRID_SIZE - 2 && grid[row][col + 2].type === type2 && (col < GRID_SIZE - 3 ? grid[row][col + 3].type === type2 : false)) createsMatch = true;
          if (col >= 1 && col < GRID_SIZE - 2 && grid[row][col - 1].type === type2 && grid[row][col + 2].type === type2) createsMatch = true;
          
          // Check horizontal match for second cell after swap
          if (col >= 1 && grid[row][col - 1].type === type1 && (col >= 2 ? grid[row][col - 2].type === type1 : false)) createsMatch = true;
          if (col < GRID_SIZE - 3 && grid[row][col + 2].type === type1 && grid[row][col + 3].type === type1) createsMatch = true;
          if (col >= 1 && col < GRID_SIZE - 3 && grid[row][col - 1].type === type1 && grid[row][col + 2].type === type1) createsMatch = true;
          
          // Check vertical matches
          if (row >= 2 && grid[row - 1][col].type === type2 && grid[row - 2][col].type === type2) createsMatch = true;
          if (row < GRID_SIZE - 2 && grid[row + 1][col].type === type2 && grid[row + 2][col].type === type2) createsMatch = true;
          if (row >= 1 && row < GRID_SIZE - 1 && grid[row - 1][col].type === type2 && grid[row + 1][col].type === type2) createsMatch = true;
          
          if (row >= 2 && grid[row - 1][col + 1].type === type1 && grid[row - 2][col + 1].type === type1) createsMatch = true;
          if (row < GRID_SIZE - 2 && grid[row + 1][col + 1].type === type1 && grid[row + 2][col + 1].type === type1) createsMatch = true;
          if (row >= 1 && row < GRID_SIZE - 1 && grid[row - 1][col + 1].type === type1 && grid[row + 1][col + 1].type === type1) createsMatch = true;
          
          if (createsMatch) {
            moves.add(`${row}-${col}`);
            moves.add(`${row}-${col + 1}`);
          }
        }
        
        // Check vertical swap
        if (row < GRID_SIZE - 1 && grid[row + 1][col].type !== "rock") {
          const type1 = grid[row][col].type;
          const type2 = grid[row + 1][col].type;
          
          let createsMatch = false;
          
          // Similar checks for vertical swap
          if (col >= 2 && grid[row][col - 1].type === type2 && grid[row][col - 2].type === type2) createsMatch = true;
          if (col < GRID_SIZE - 2 && grid[row][col + 1].type === type2 && grid[row][col + 2].type === type2) createsMatch = true;
          if (col >= 1 && col < GRID_SIZE - 1 && grid[row][col - 1].type === type2 && grid[row][col + 1].type === type2) createsMatch = true;
          
          if (col >= 2 && grid[row + 1][col - 1].type === type1 && grid[row + 1][col - 2].type === type1) createsMatch = true;
          if (col < GRID_SIZE - 2 && grid[row + 1][col + 1].type === type1 && grid[row + 1][col + 2].type === type1) createsMatch = true;
          if (col >= 1 && col < GRID_SIZE - 1 && grid[row + 1][col - 1].type === type1 && grid[row + 1][col + 1].type === type1) createsMatch = true;
          
          if (row >= 2 && grid[row - 1][col].type === type2 && grid[row - 2][col].type === type2) createsMatch = true;
          if (row < GRID_SIZE - 2 && grid[row + 2][col].type === type2 && (row < GRID_SIZE - 3 ? grid[row + 3][col].type === type2 : false)) createsMatch = true;
          if (row >= 1 && row < GRID_SIZE - 2 && grid[row - 1][col].type === type2 && grid[row + 2][col].type === type2) createsMatch = true;
          
          if (row >= 1 && grid[row - 1][col].type === type1 && (row >= 2 ? grid[row - 2][col].type === type1 : false)) createsMatch = true;
          if (row < GRID_SIZE - 3 && grid[row + 2][col].type === type1 && grid[row + 3][col].type === type1) createsMatch = true;
          
          if (createsMatch) {
            moves.add(`${row}-${col}`);
            moves.add(`${row + 1}-${col}`);
          }
        }
      }
    }
    
    setPossibleMoves(moves);
  }, [grid]);

  useEffect(() => {
    if (gameStarted && !gameWon && !gameLost && !isSwapping) {
      findPossibleMoves();
    }
  }, [grid, gameStarted, gameWon, gameLost, isSwapping, findPossibleMoves]);

  const handleCellClick = (row: number, col: number) => {
    if (grid[row][col].type === "rock" || grid[row][col].matched || isSwapping) {
      return;
    }

    if (!selectedCell) {
      setSelectedCell({ row, col });
    } else {
      const rowDiff = Math.abs(selectedCell.row - row);
      const colDiff = Math.abs(selectedCell.col - col);

      if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
        // Adjacent cells - swap
        setIsSwapping(true);
        const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
        const temp = newGrid[selectedCell.row][selectedCell.col];
        newGrid[selectedCell.row][selectedCell.col] = newGrid[row][col];
        newGrid[row][col] = temp;

        // Preserve isPath status
        const tempIsPath = newGrid[selectedCell.row][selectedCell.col].isPath;
        newGrid[selectedCell.row][selectedCell.col].isPath = newGrid[row][col].isPath;
        newGrid[row][col].isPath = tempIsPath;

        setGrid(newGrid);
        setSelectedCell(null);
        setMoves((prev) => prev - 1);

        setTimeout(() => {
          const hasMatches = checkMatches();
          if (!hasMatches) {
            // Swap back if no matches
            toast({
              title: "Không hợp lệ!",
              description: "Nước đi này không tạo ra match-3",
              variant: "destructive",
            });
            
            const revertGrid = newGrid.map((r) => r.map((c) => ({ ...c })));
            const tempRevert = revertGrid[selectedCell.row][selectedCell.col];
            revertGrid[selectedCell.row][selectedCell.col] = revertGrid[row][col];
            revertGrid[row][col] = tempRevert;
            
            const tempIsPathRevert = revertGrid[selectedCell.row][selectedCell.col].isPath;
            revertGrid[selectedCell.row][selectedCell.col].isPath = revertGrid[row][col].isPath;
            revertGrid[row][col].isPath = tempIsPathRevert;
            
            setGrid(revertGrid);
            setMoves((prev) => prev + 1);
            
            setTimeout(() => {
              setIsSwapping(false);
            }, 300);
          } else {
            setIsSwapping(false);
          }
        }, 300);
      } else {
        setSelectedCell({ row, col });
      }
    }
  };

  useEffect(() => {
    if (pathProgress >= level.pathLength && gameStarted && !gameWon) {
      if (currentLevel < 5) {
        toast({
          title: "Qua màn! 🎉",
          description: `Bạn đã mở khóa đường đến công chúa!`,
        });
        setTimeout(() => {
          setCurrentLevel((prev) => prev + 1);
        }, 1500);
      } else {
        setGameWon(true);

        // Save score to database
        if (groupId && userId) {
          const saveScore = async () => {
            try {
              const { error } = await supabase.from("game_scores").insert({
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
          title: "Chiến thắng! 👑💕👸",
          description: "Hoàng tử đã cứu được công chúa!",
        });
      }
    }
  }, [pathProgress, level.pathLength, gameStarted, currentLevel, toast, gameWon, groupId, userId, score]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const restartLevel = () => {
    setGameLost(false);
    setGameStarted(true);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
          <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
          Giải Cứu Công Chúa
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!gameStarted && !gameWon && (
          <div className="text-center space-y-4 py-8">
            <div className="text-6xl">👑</div>
            <h3 className="text-2xl font-bold">Màn {currentLevel}</h3>
            <p className="text-muted-foreground">
              Ghép 3 viên kẹo cùng màu để mở đường cho hoàng tử!
            </p>
            <div className="flex justify-between items-center max-w-xs mx-auto text-sm">
              <div>⏱️ {formatTime(level.timeLimit)}</div>
              <div>🎯 {level.scoreTarget} điểm</div>
              <div>👟 {level.movesLimit} nước</div>
            </div>
            <Button onClick={() => setGameStarted(true)} size="lg">
              Bắt đầu
            </Button>
          </div>
        )}

        {gameWon && (
          <div className="text-center space-y-4 py-8">
            <div className="text-6xl">👑💕👸</div>
            <h3 className="text-3xl font-bold text-primary">Chiến Thắng!</h3>
            <p className="text-xl">Hoàng tử đã cứu được công chúa!</p>
            <p className="text-lg font-semibold">Tổng điểm: {score}</p>
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

        {gameLost && (
          <div className="text-center space-y-4 py-8">
            <div className="text-6xl">😢</div>
            <h3 className="text-2xl font-bold">Chưa qua màn</h3>
            <p>Điểm: {score} / {level.scoreTarget}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={restartLevel}>Thử lại</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setGameLost(false);
                  setGameStarted(false);
                }}
              >
                Về menu
              </Button>
            </div>
          </div>
        )}

        {gameStarted && !gameWon && !gameLost && (
          <>
            {/* Characters */}
            <div className="relative h-16 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-between px-4">
              <div className="text-4xl">👑</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Progress value={(pathProgress / level.pathLength) * 100} className="w-3/4" />
              </div>
              <div className="text-4xl">👸</div>
            </div>

            {/* Game Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-sm">
              <div className="bg-muted p-2 rounded">
                <div className="text-muted-foreground">Màn</div>
                <div className="font-bold">{currentLevel}/5</div>
              </div>
              <div className="bg-muted p-2 rounded">
                <div className="text-muted-foreground">Thời gian</div>
                <div className="font-bold">{formatTime(timeLeft)}</div>
              </div>
              <div className="bg-muted p-2 rounded">
                <div className="text-muted-foreground">Điểm</div>
                <div className="font-bold">{score}</div>
              </div>
              <div className="bg-muted p-2 rounded">
                <div className="text-muted-foreground">Nước đi</div>
                <div className="font-bold">{moves}</div>
              </div>
            </div>

            {/* Path Progress */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Đường đã mở: {pathProgress} / {level.pathLength}
              </p>
            </div>

            {/* Game Grid */}
            <div
              className="grid gap-1 mx-auto"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                maxWidth: "min(100%, 500px)",
              }}
            >
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                  const isPossibleMove = possibleMoves.has(`${rowIndex}-${colIndex}`);
                  const isAdjacentToSelected = selectedCell && 
                    ((Math.abs(selectedCell.row - rowIndex) === 1 && selectedCell.col === colIndex) ||
                     (Math.abs(selectedCell.col - colIndex) === 1 && selectedCell.row === rowIndex));
                  
                  return (
                    <button
                      key={cell.id}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      disabled={cell.matched || cell.type === "rock" || isSwapping}
                      className={`
                        aspect-square rounded-lg transition-all duration-200
                        ${candyColors[cell.type]}
                        ${cell.isPath ? "ring-2 ring-yellow-400 ring-offset-2" : ""}
                        ${isSelected ? "ring-4 ring-white scale-110 shadow-lg z-10" : ""}
                        ${isAdjacentToSelected && !cell.matched && cell.type !== "rock" ? "ring-2 ring-white/50 animate-pulse" : ""}
                        ${isPossibleMove && !isSelected ? "animate-bounce" : ""}
                        ${cell.matched ? "opacity-0 scale-0" : "opacity-100 scale-100"}
                        hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed
                        flex items-center justify-center text-xl sm:text-2xl relative
                      `}
                    >
                      {candyEmojis[cell.type]}
                      {isPossibleMove && !isSelected && (
                        <div className="absolute inset-0 bg-white/20 rounded-lg" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Instructions & Legend */}
            <div className="space-y-2">
              <div className="text-center text-sm bg-primary/10 p-3 rounded-lg">
                <p className="font-semibold mb-1">💡 Cách chơi:</p>
                <p className="text-muted-foreground">
                  Click vào 1 viên kẹo, sau đó click vào viên kẹo liền kề để đổi chỗ.
                  Ghép 3+ viên cùng màu theo hàng hoặc cột để được điểm!
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 rounded border-2 border-yellow-400" />
                  <span>Đường đi</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🪨</span>
                  <span>Chướng ngại vật</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 rounded bg-white/20 animate-bounce" />
                  <span>Gợi ý nước đi</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
