import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Heart, Star, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type CandyType = "red" | "blue" | "green" | "yellow" | "purple" | "rock";
type SpecialType = "none" | "striped-h" | "striped-v" | "wrapped" | "color-bomb";

interface GridCell {
  type: CandyType;
  id: string;
  matched: boolean;
  isPath?: boolean;
  special: SpecialType;
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
  red: "bg-gradient-to-br from-pink-400 to-rose-500",
  blue: "bg-gradient-to-br from-blue-400 to-cyan-500",
  green: "bg-gradient-to-br from-emerald-400 to-green-500",
  yellow: "bg-gradient-to-br from-yellow-300 to-amber-400",
  purple: "bg-gradient-to-br from-purple-400 to-violet-500",
  rock: "bg-gradient-to-br from-gray-500 to-gray-700",
};

const candyEmojis: Record<CandyType, string> = {
  red: "💖",
  blue: "💎",
  green: "✨",
  yellow: "⭐",
  purple: "💜",
  rock: "🪨",
};

const specialEmojis: Record<SpecialType, string> = {
  "none": "",
  "striped-h": "💫",
  "striped-v": "🌠",
  "wrapped": "✨",
  "color-bomb": "🌈",
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
  // Characters and movement path
  const [princePos, setPrincePos] = useState<{ row: number; col: number } | null>(null);
  const [princessPos, setPrincessPos] = useState<{ row: number; col: number } | null>(null);
  const [openedPath, setOpenedPath] = useState<boolean[][]>(
    Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false))
  );
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
          special: "none",
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

  // Initialize characters and opened path when grid is ready
  useEffect(() => {
    if (!gameStarted || grid.length !== GRID_SIZE || !grid[0] || grid[0].length !== GRID_SIZE) return;

    // Reset opened path map
    setOpenedPath(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false)));

    // Prince starts near top-left on first non-rock cell
    let start = { row: 0, col: 0 };
    if (grid[start.row][start.col]?.type === "rock") {
      outer: for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (grid[r][c].type !== "rock") { start = { row: r, col: c }; break outer; }
        }
      }
    }
    setPrincePos(start);

    // Princess is placed near bottom-right on first non-rock cell
    let end = { row: GRID_SIZE - 1, col: GRID_SIZE - 1 };
    if (grid[end.row][end.col]?.type === "rock") {
      outer2: for (let r = GRID_SIZE - 1; r >= 0; r--) {
        for (let c = GRID_SIZE - 1; c >= 0; c--) {
          if (grid[r][c].type !== "rock") { end = { row: r, col: c }; break outer2; }
        }
      }
    }
    setPrincessPos(end);
  }, [gameStarted, grid]);

  // Keyboard controls for prince movement
  useEffect(() => {
    if (!gameStarted || gameWon || gameLost || !princePos || !princessPos) return;

    const handler = (e: KeyboardEvent) => {
      const key = e.key;
      let dr = 0, dc = 0;
      if (key === "ArrowUp" || key === "w" || key === "W") dr = -1;
      else if (key === "ArrowDown" || key === "s" || key === "S") dr = 1;
      else if (key === "ArrowLeft" || key === "a" || key === "A") dc = -1;
      else if (key === "ArrowRight" || key === "d" || key === "D") dc = 1;
      else return;

      e.preventDefault();
      const nr = princePos.row + dr;
      const nc = princePos.col + dc;
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) return;
      if (!openedPath[nr]?.[nc]) return; // can only move on opened path cells
      if (grid[nr][nc].type === "rock") return;

      const next = { row: nr, col: nc };
      setPrincePos(next);

      // Reached princess
      if (next.row === princessPos.row && next.col === princessPos.col) {
        setGameWon(true);
        toast({ title: "Hoàng tử gặp công chúa! 💕", description: "Bạn đã mở đường thành công." });
        if (groupId && userId) {
          supabase.from("game_scores").insert({ user_id: userId, group_id: groupId, game_type: "princess_rescue", score });
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [gameStarted, gameWon, gameLost, princePos, princessPos, openedPath, grid, toast, groupId, userId, score]);

  const hasAnyMatch = (gridToCheck: GridCell[][]): boolean => {
    if (!gridToCheck || gridToCheck.length !== GRID_SIZE || !gridToCheck[0] || gridToCheck[0].length !== GRID_SIZE) {
      return false;
    }
    // Check horizontal matches
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        const type = gridToCheck[row][col].type;
        if (
          type !== "rock" &&
          gridToCheck[row][col + 1].type === type &&
          gridToCheck[row][col + 2].type === type
        ) {
          return true;
        }
      }
    }
    // Check vertical matches
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE - 2; row++) {
        const type = gridToCheck[row][col].type;
        if (
          type !== "rock" &&
          gridToCheck[row + 1][col].type === type &&
          gridToCheck[row + 2][col].type === type
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const checkMatches = useCallback(() => {
    if (!grid || grid.length !== GRID_SIZE || !grid[0] || grid[0].length !== GRID_SIZE) {
      return false;
    }
    
    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    let hasMatches = false;
    const matched: { row: number; col: number; matchLength: number; isHorizontal: boolean }[] = [];

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
          let checkCol = col + 3;
          while (checkCol < GRID_SIZE && newGrid[row][checkCol].type === type) {
            matchLength++;
            checkCol++;
          }
          
          for (let i = 0; i < matchLength; i++) {
            matched.push({ row, col: col + i, matchLength, isHorizontal: true });
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
          let checkRow = row + 3;
          while (checkRow < GRID_SIZE && newGrid[checkRow][col].type === type) {
            matchLength++;
            checkRow++;
          }
          
          for (let i = 0; i < matchLength; i++) {
            matched.push({ row: row + i, col, matchLength, isHorizontal: false });
          }
          hasMatches = true;
          row += matchLength - 1;
        }
      }
    }

    if (hasMatches) {
      const uniqueMatched = Array.from(
        new Set(matched.map((m) => `${m.row}-${m.col}`))
      ).map((key) => {
        const [row, col] = key.split("-").map(Number);
        const info = matched.find((m) => m.row === row && m.col === col);
        return { row, col, matchLength: info?.matchLength || 3, isHorizontal: info?.isHorizontal || true };
      });

      // Check for special candy creation
      uniqueMatched.forEach(({ row, col, matchLength, isHorizontal }) => {
        if (matchLength >= 5) {
          newGrid[row][col].special = "color-bomb";
        } else if (matchLength === 4) {
          newGrid[row][col].special = isHorizontal ? "striped-h" : "striped-v";
        }
      });

      // Activate special candies if matched
      const specialsTriggered: { row: number; col: number; special: SpecialType }[] = [];
      uniqueMatched.forEach(({ row, col }) => {
        if (newGrid[row][col].special !== "none") {
          specialsTriggered.push({ row, col, special: newGrid[row][col].special });
        }
        newGrid[row][col].matched = true;
      });

      // Apply special candy effects
      specialsTriggered.forEach(({ row, col, special }) => {
        if (special === "striped-h") {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (newGrid[row][c].type !== "rock") newGrid[row][c].matched = true;
          }
        } else if (special === "striped-v") {
          for (let r = 0; r < GRID_SIZE; r++) {
            if (newGrid[r][col].type !== "rock") newGrid[r][col].matched = true;
          }
        } else if (special === "wrapped") {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = row + dr, nc = col + dc;
              if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && newGrid[nr][nc].type !== "rock") {
                newGrid[nr][nc].matched = true;
              }
            }
          }
        } else if (special === "color-bomb") {
          const targetType = newGrid[row][col].type;
          for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
              if (newGrid[r][c].type === targetType && newGrid[r][c].type !== "rock") {
                newGrid[r][c].matched = true;
              }
            }
          }
        }
      });

      setGrid(newGrid);
      const allMatched = newGrid.flat().filter((c) => c.matched);
      const points = allMatched.length * 100;
      setScore((prev) => prev + points);

      if (specialsTriggered.length > 0) {
        toast({ title: "🎉 Special Candy!", description: `+${points} điểm!` });
      }

      setOpenedPath((prev) => {
        const next = prev.map((r) => [...r]);
        allMatched.forEach((cell) => {
          const r = parseInt(cell.id.split("-")[0]);
          const c = parseInt(cell.id.split("-")[1]);
          if (cell.isPath) next[r][c] = true;
        });
        return next;
      });

      let pathCleared = allMatched.filter((c) => c.isPath).length;
      if (pathCleared > 0) {
        setPathProgress((prev) => Math.min(prev + pathCleared, level.pathLength));
      }

      setTimeout(() => {
        fillEmptyCells();
      }, 300);
    }

    return hasMatches;
  }, [grid, level.pathLength, toast]);

  const fillEmptyCells = useCallback(() => {
    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));

    for (let col = 0; col < GRID_SIZE; col++) {
      // Collect non-matched cells from bottom to top
      const stack: GridCell[] = [];
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        if (!newGrid[row][col].matched) {
          stack.push({ ...newGrid[row][col], matched: false });
        }
      }

      // Rebuild the column from bottom to top, preserving isPath at board positions
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        const preservedIsPath = grid[row][col].isPath;
        if (stack.length > 0) {
          const cell = stack.shift()!; // take next from bottom stack
          newGrid[row][col] = { ...cell, matched: false, isPath: preservedIsPath };
        } else {
          newGrid[row][col] = {
            type: generateRandomCandy(),
            id: `${row}-${col}-${Date.now()}-${Math.random()}`,
            matched: false,
            isPath: preservedIsPath,
            special: "none",
          };
        }
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
    // Guard: Check if grid is properly initialized
    if (!grid || grid.length !== GRID_SIZE || !grid[0] || grid[0].length !== GRID_SIZE) {
      return;
    }
    
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
          // Adjacent cells - swap candies only, keep isPath at board positions
          setIsSwapping(true);
          const prevSelectedCell = { ...selectedCell };
          const swappedGrid = grid.map((r) => r.map((c) => ({ ...c })));
          
          // Save isPath flags before swap (they stay with board positions)
          const isPath1 = swappedGrid[selectedCell.row][selectedCell.col].isPath;
          const isPath2 = swappedGrid[row][col].isPath;
          
          // Swap candy types and ids only
          const tempType = swappedGrid[selectedCell.row][selectedCell.col].type;
          const tempId = swappedGrid[selectedCell.row][selectedCell.col].id;
          swappedGrid[selectedCell.row][selectedCell.col].type = swappedGrid[row][col].type;
          swappedGrid[selectedCell.row][selectedCell.col].id = swappedGrid[row][col].id;
          swappedGrid[row][col].type = tempType;
          swappedGrid[row][col].id = tempId;
          
          // Restore isPath at original positions
          swappedGrid[selectedCell.row][selectedCell.col].isPath = isPath1;
          swappedGrid[row][col].isPath = isPath2;

          // Validate: does this swap create any match?
          const validMove = hasAnyMatch(swappedGrid);
          if (!validMove) {
            toast({
              title: "Không hợp lệ!",
              description: "Nước đi này không tạo ra match-3",
              variant: "destructive",
            });
            setIsSwapping(false);
            setSelectedCell(null);
            return;
          }

          // Apply swap, then process matches
          setGrid(swappedGrid);
          setSelectedCell(null);
          setMoves((prev) => prev - 1);

          setTimeout(() => {
            const hasMatchesNow = checkMatches();
            if (!hasMatchesNow) {
              // Rare: revert swap
              const revertGrid = swappedGrid.map((r) => r.map((c) => ({ ...c })));
              const isPath1R = revertGrid[prevSelectedCell.row][prevSelectedCell.col].isPath;
              const isPath2R = revertGrid[row][col].isPath;
              const tType = revertGrid[prevSelectedCell.row][prevSelectedCell.col].type;
              const tId = revertGrid[prevSelectedCell.row][prevSelectedCell.col].id;
              revertGrid[prevSelectedCell.row][prevSelectedCell.col].type = revertGrid[row][col].type;
              revertGrid[prevSelectedCell.row][prevSelectedCell.col].id = revertGrid[row][col].id;
              revertGrid[row][col].type = tType;
              revertGrid[row][col].id = tId;
              revertGrid[prevSelectedCell.row][prevSelectedCell.col].isPath = isPath1R;
              revertGrid[row][col].isPath = isPath2R;
              setGrid(revertGrid);
              setMoves((prev) => prev + 1);
            }
            setIsSwapping(false);
          }, 50);
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
    <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-blue-950/20 border-2 border-pink-200 dark:border-pink-800 shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3 bg-gradient-to-r from-pink-100/50 to-purple-100/50 dark:from-pink-900/20 dark:to-purple-900/20">
        <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent font-bold">
          <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 animate-pulse" />
          💖 Hành Trình Tình Yêu 💖
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!gameStarted && !gameWon && (
          <div className="text-center space-y-6 py-12 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-2xl border-2 border-pink-200 dark:border-pink-700">
            <div className="text-7xl animate-bounce">🤴💖👸</div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Màn {currentLevel} - Hành Trình Tình Yêu
            </h3>
            <p className="text-lg text-muted-foreground px-4">
              ✨ Ghép 3 viên ngọc ma thuật để mở đường cho Hoàng Tử gặp Công Chúa! 💕
            </p>
            <div className="flex justify-between items-center max-w-md mx-auto text-sm bg-white/50 dark:bg-black/20 p-4 rounded-xl">
              <div className="flex flex-col items-center">
                <span className="text-2xl">⏱️</span>
                <span className="font-semibold">{formatTime(level.timeLimit)}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl">🎯</span>
                <span className="font-semibold">{level.scoreTarget} điểm</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl">👟</span>
                <span className="font-semibold">{level.movesLimit} nước</span>
              </div>
            </div>
            <Button 
              onClick={() => setGameStarted(true)} 
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              ✨ Bắt đầu hành trình ✨
            </Button>
          </div>
        )}

        {gameWon && (
          <div className="text-center space-y-6 py-12 bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 dark:from-yellow-900/30 dark:via-pink-900/30 dark:to-purple-900/30 rounded-2xl border-2 border-yellow-300 dark:border-yellow-700 shadow-2xl animate-fade-in">
            <div className="text-8xl animate-bounce">🤴💕👸</div>
            <div className="space-y-2">
              <h3 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                ✨ Chiến Thắng! ✨
              </h3>
              <p className="text-2xl animate-pulse">🌟 Tình yêu đã chiến thắng! 🌟</p>
            </div>
            <div className="text-6xl space-x-2">
              <span className="inline-block animate-bounce" style={{ animationDelay: '0s' }}>⭐</span>
              <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>💖</span>
              <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>🌈</span>
              <span className="inline-block animate-bounce" style={{ animationDelay: '0.3s' }}>✨</span>
            </div>
            <p className="text-xl">Hoàng tử đã gặp được công chúa của mình!</p>
            <div className="bg-white/60 dark:bg-black/20 p-6 rounded-xl inline-block">
              <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-pink-600 bg-clip-text text-transparent">
                Tổng điểm: {score} 🏆
              </p>
            </div>
            <Button
              onClick={() => {
                setGameWon(false);
                setGameStarted(false);
                setCurrentLevel(1);
                setScore(0);
              }}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              💖 Chơi lại hành trình 💖
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
            <div className="relative h-20 rounded-2xl bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 dark:from-pink-900/40 dark:via-purple-900/40 dark:to-blue-900/40 flex items-center justify-between px-6 border-2 border-pink-300 dark:border-pink-700 shadow-lg">
              <div className="text-5xl animate-pulse drop-shadow-lg">{princePos ? "🤴" : "👑"}</div>
              <div className="absolute inset-0 flex items-center justify-center px-20">
                <div className="w-full space-y-2">
                  <div className="flex justify-center gap-1 text-xl">
                    {Array.from({ length: Math.ceil((pathProgress / level.pathLength) * 10) }).map((_, i) => (
                      <span key={i} className="animate-pulse">💖</span>
                    ))}
                  </div>
                  <Progress value={(pathProgress / level.pathLength) * 100} className="h-3 bg-pink-100 dark:bg-pink-900" />
                </div>
              </div>
              <div className="text-5xl animate-pulse drop-shadow-lg">{princessPos ? "👸" : "👸"}</div>
            </div>

            {/* Game Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm">
              <div className="bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 p-3 rounded-xl border border-pink-200 dark:border-pink-800 shadow-md">
                <div className="text-2xl mb-1">👑</div>
                <div className="text-muted-foreground text-xs">Màn</div>
                <div className="font-bold text-lg">{currentLevel}/5</div>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 p-3 rounded-xl border border-blue-200 dark:border-blue-800 shadow-md">
                <div className="text-2xl mb-1">⏱️</div>
                <div className="text-muted-foreground text-xs">Thời gian</div>
                <div className="font-bold text-lg">{formatTime(timeLeft)}</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 p-3 rounded-xl border border-yellow-200 dark:border-yellow-800 shadow-md">
                <div className="text-2xl mb-1">⭐</div>
                <div className="text-muted-foreground text-xs">Điểm</div>
                <div className="font-bold text-lg">{score}</div>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 p-3 rounded-xl border border-green-200 dark:border-green-800 shadow-md">
                <div className="text-2xl mb-1">👟</div>
                <div className="text-muted-foreground text-xs">Nước đi</div>
                <div className="font-bold text-lg">{moves}</div>
              </div>
            </div>

            {/* Path Progress */}
            <div className="text-center bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 p-4 rounded-xl border border-pink-200 dark:border-pink-800">
              <p className="text-sm font-semibold mb-2 flex items-center justify-center gap-2">
                <span className="text-xl">✨</span>
                Đường tình yêu đã mở: {pathProgress} / {level.pathLength}
                <span className="text-xl">✨</span>
              </p>
              <div className="flex justify-center gap-1">
                {Array.from({ length: level.pathLength }).map((_, i) => (
                  <span key={i} className={`text-2xl transition-all ${i < pathProgress ? 'scale-110 animate-bounce' : 'opacity-30'}`}>
                    {i < pathProgress ? '💖' : '🤍'}
                  </span>
                ))}
              </div>
            </div>

            {/* Game Grid */}
            <div
              className="grid gap-2 mx-auto p-4 bg-gradient-to-br from-purple-100/50 via-pink-100/50 to-blue-100/50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-blue-900/20 rounded-2xl border-2 border-pink-200 dark:border-pink-800 shadow-xl"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                maxWidth: "min(100%, 520px)",
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
                        aspect-square rounded-xl transition-all duration-300 transform
                        ${candyColors[cell.type]}
                        ${cell.isPath ? "ring-4 ring-yellow-400 ring-offset-2 ring-offset-pink-100 dark:ring-offset-pink-900 shadow-lg shadow-yellow-300/50" : ""}
                        ${isSelected ? "ring-4 ring-pink-500 shadow-2xl scale-110 z-10 shadow-pink-500/50" : ""}
                        ${isAdjacentToSelected && !cell.matched && cell.type !== "rock" ? "ring-2 ring-pink-300 shadow-lg" : ""}
                        ${cell.matched ? "opacity-0 scale-50" : "opacity-100 hover:scale-105"}
                        disabled:cursor-not-allowed
                        flex items-center justify-center text-2xl sm:text-3xl relative
                        backdrop-blur-sm shadow-md hover:shadow-xl
                      `}
                    >
                      <span className="relative drop-shadow-lg transform transition-transform hover:scale-110">
                        {candyEmojis[cell.type]}
                        {cell.special !== "none" && (
                          <span className="absolute -top-2 -right-2 text-sm animate-pulse">{specialEmojis[cell.special]}</span>
                        )}
                      </span>
                      {isPossibleMove && !isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-pink-200/30 rounded-xl animate-pulse" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-3xl sm:text-4xl drop-shadow-2xl">
                        {princePos && princePos.row === rowIndex && princePos.col === colIndex && <span className="animate-bounce">🤴</span>}
                        {princessPos && princessPos.row === rowIndex && princessPos.col === colIndex && <span className="animate-bounce">👸</span>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Instructions & Legend */}
            <div className="space-y-3">
              <div className="text-center text-sm bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 dark:from-pink-900/30 dark:via-purple-900/30 dark:to-blue-900/30 p-4 rounded-xl border border-pink-200 dark:border-pink-800 shadow-lg">
                <p className="font-bold text-base mb-2 flex items-center justify-center gap-2">
                  <span className="text-xl">💡</span>
                  Cách chơi
                  <span className="text-xl">💡</span>
                </p>
                <p className="text-muted-foreground mb-2">
                  ✨ Click vào viên ngọc, sau đó click viên ngọc liền kề để đổi chỗ. Ghép 3+ viên cùng loại để mở đường tình yêu!
                </p>
                <p className="text-muted-foreground">
                  🎮 Dùng phím mũi tên hoặc WASD để di chuyển Hoàng tử đến gặp Công chúa! 💕
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center text-xs sm:text-sm">
                <div className="flex items-center gap-2 bg-white/60 dark:bg-black/20 px-3 py-2 rounded-lg border border-yellow-300 dark:border-yellow-700">
                  <div className="w-6 h-6 rounded-lg border-2 border-yellow-400 shadow-sm" />
                  <span className="font-semibold">Đường tình yêu</span>
                </div>
                <div className="flex items-center gap-2 bg-white/60 dark:bg-black/20 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700">
                  <span className="text-lg">🪨</span>
                  <span className="font-semibold">Chướng ngại</span>
                </div>
                <div className="flex items-center gap-2 bg-white/60 dark:bg-black/20 px-3 py-2 rounded-lg border border-pink-300 dark:border-pink-700">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-200 to-purple-200 shadow-sm" />
                  <span className="font-semibold">Gợi ý</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
