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

const specialEmojis: Record<SpecialType, string> = {
  "none": "",
  "striped-h": "➡️",
  "striped-v": "⬆️",
  "wrapped": "💥",
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
              <div className="text-4xl">{princePos ? "🤴" : "👑"}</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Progress value={(pathProgress / level.pathLength) * 100} className="w-3/4" />
              </div>
              <div className="text-4xl">{princessPos ? "👸" : "👸"}</div>
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
                        ${isSelected ? "ring-4 ring-white shadow-lg z-10" : ""}
                        ${isAdjacentToSelected && !cell.matched && cell.type !== "rock" ? "ring-2 ring-white/50" : ""}
                        ${cell.matched ? "opacity-0" : "opacity-100"}
                        disabled:cursor-not-allowed
                        flex items-center justify-center text-xl sm:text-2xl relative
                      `}
                    >
                      <span className="relative">
                        {candyEmojis[cell.type]}
                        {cell.special !== "none" && (
                          <span className="absolute -top-1 -right-1 text-xs">{specialEmojis[cell.special]}</span>
                        )}
                      </span>
                      {isPossibleMove && !isSelected && (
                        <div className="absolute inset-0 bg-white/20 rounded-lg" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-2xl">
                        {princePos && princePos.row === rowIndex && princePos.col === colIndex && <span>🤴</span>}
                        {princessPos && princessPos.row === rowIndex && princessPos.col === colIndex && <span>👸</span>}
                      </div>
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
                  Click vào 1 viên kẹo, sau đó click viên kẹo liền kề để đổi chỗ. Ghép 3+ viên cùng màu theo hàng/cột để mở đường.
                </p>
                <p className="text-muted-foreground">
                  Dùng phím mũi tên hoặc WASD để di chuyển hoàng tử trên các ô đường đã mở. Tới được công chúa để thắng!
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
                  <div className="w-6 h-6 rounded bg-white/20" />
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
