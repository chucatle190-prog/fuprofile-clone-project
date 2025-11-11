import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Match3Engine, type Cell } from "./GameEngine";
import { GAME_CONFIG } from "@/config/gameConfig";
import { useToast } from "@/hooks/use-toast";
import { useFUToken } from "@/hooks/useFUToken";
import Shop from "./Shop";
import ThreeScene from "./ThreeScene";
import { ShoppingBag, Wallet, Home, Trophy } from "lucide-react";

interface GameState {
  level: number;
  score: number;
  moves: number;
  target: number;
  isPlaying: boolean;
  gameStatus: 'playing' | 'won' | 'lost' | 'rescuing' | 'rescued';
}

export default function CandyCrushGame() {
  const [engine] = useState(() => new Match3Engine());
  const [grid, setGrid] = useState<Cell[][]>(engine.grid);
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    score: 0,
    moves: GAME_CONFIG.LEVELS[0].moves,
    target: GAME_CONFIG.LEVELS[0].targetScore,
    isPlaying: false,
    gameStatus: 'playing',
  });
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showLevelMap, setShowLevelMap] = useState(true);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [threeSceneState, setThreeSceneState] = useState<'playing' | 'rescuing' | 'rescued'>('playing');
  
  const { toast } = useToast();
  const { account, fuBalance } = useFUToken();

  const startLevel = (levelNum: number) => {
    const levelConfig = GAME_CONFIG.LEVELS[levelNum - 1];
    engine.grid = engine.initializeGrid();
    
    if (levelConfig.obstacles.length > 0) {
      engine.addObstacles(levelConfig.obstacles);
    }
    
    setGrid([...engine.grid]);
    setGameState({
      level: levelNum,
      score: 0,
      moves: levelConfig.moves,
      target: levelConfig.targetScore,
      isPlaying: true,
      gameStatus: 'playing',
    });
    setShowLevelMap(false);
    setThreeSceneState('playing');
  };

  const handleCellClick = (row: number, col: number) => {
    if (!gameState.isPlaying || isAnimating) return;

    if (!selectedCell) {
      setSelectedCell([row, col]);
    } else {
      const [selRow, selCol] = selectedCell;
      
      if (row === selRow && col === selCol) {
        setSelectedCell(null);
        return;
      }

      // Try to swap
      performSwap(selRow, selCol, row, col);
      setSelectedCell(null);
    }
  };

  const performSwap = async (row1: number, col1: number, row2: number, col2: number) => {
    setIsAnimating(true);
    
    const result = engine.swap(row1, col1, row2, col2);
    
    if (!result.valid) {
      toast({
        title: "Invalid Move",
        description: "This swap doesn't create a match!",
        variant: "destructive",
      });
      setIsAnimating(false);
      return;
    }

    setGrid([...engine.grid]);
    setGameState(prev => ({ ...prev, moves: prev.moves - 1 }));
    
    // Process matches cascade
    await processCascade();
    
    setIsAnimating(false);
    
    // Check win/lose conditions
    checkGameStatus();
  };

  const processCascade = async () => {
    let totalScore = 0;
    let hasMatches = true;
    
    while (hasMatches) {
      const matches = engine.findMatches();
      
      if (matches.length === 0) {
        hasMatches = false;
        break;
      }
      
      const score = engine.clearMatches(matches);
      totalScore += score;
      setGrid([...engine.grid]);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      engine.applyGravity();
      setGrid([...engine.grid]);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      engine.refillGrid();
      setGrid([...engine.grid]);
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setGameState(prev => ({ ...prev, score: prev.score + totalScore }));
  };

  const checkGameStatus = () => {
    setGameState(prev => {
      if (prev.score >= prev.target) {
        // Check if final level
        if (prev.level === 20) {
          setThreeSceneState('rescuing');
          return { ...prev, gameStatus: 'rescuing', isPlaying: false };
        }
        return { ...prev, gameStatus: 'won', isPlaying: false };
      } else if (prev.moves <= 0) {
        return { ...prev, gameStatus: 'lost', isPlaying: false };
      }
      return prev;
    });
  };

  const handlePurchase = (itemKey: string) => {
    setInventory(prev => ({
      ...prev,
      [itemKey]: (prev[itemKey] || 0) + 1,
    }));
    
    toast({
      title: "Item Purchased! 🎉",
      description: "Item added to your inventory",
    });
  };

  const handleRescueComplete = () => {
    setThreeSceneState('rescued');
    setGameState(prev => ({ ...prev, gameStatus: 'rescued' }));
  };

  const getCellClassName = (row: number, col: number) => {
    const isSelected = selectedCell && selectedCell[0] === row && selectedCell[1] === col;
    return `
      relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center text-2xl sm:text-3xl
      cursor-pointer transition-all duration-200
      ${isSelected ? 'ring-4 ring-yellow-400 scale-110' : 'hover:scale-105'}
      ${grid[row][col].obstacle ? 'bg-gray-400' : 'bg-gradient-to-br from-pink-200 to-purple-200'}
      shadow-md hover:shadow-lg
    `;
  };

  const getGemDisplay = (cell: Cell) => {
    if (cell.gem === null) return '';
    
    let display = GAME_CONFIG.GEM_SYMBOLS[cell.gem];
    
    if (cell.special) {
      switch (cell.special) {
        case 'striped_h':
        case 'striped_v':
          display = '💫';
          break;
        case 'wrapped':
          display = '🌠';
          break;
        case 'color_bomb':
          display = '🌈';
          break;
      }
    }
    
    return display;
  };

  if (showLevelMap) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-4">
        <ThreeScene gameState={threeSceneState} onRescueComplete={handleRescueComplete} />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <Card className="p-6 backdrop-blur-sm bg-white/80">
            <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              🏰 Prince & Princess Journey 💖
            </h1>
            
            {account && (
              <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm">{account.slice(0, 6)}...{account.slice(-4)}</span>
                  </div>
                  <span className="font-bold">{parseFloat(fuBalance).toFixed(2)} F.U</span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 mb-6">
              {GAME_CONFIG.LEVELS.map((level, idx) => (
                <Button
                  key={idx}
                  onClick={() => startLevel(idx + 1)}
                  className="h-16 relative"
                  variant={idx === 0 ? "default" : "outline"}
                >
                  <div className="text-center">
                    <div className="text-2xl">{(idx + 1) % 5 === 0 ? '👹' : '🏰'}</div>
                    <div className="text-xs">{idx + 1}</div>
                  </div>
                </Button>
              ))}
            </div>
            
            <Button onClick={() => setShowShop(true)} className="w-full" size="lg">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Open Magic Shop
            </Button>
          </Card>
        </div>
        
        <Shop isOpen={showShop} onClose={() => setShowShop(false)} onPurchase={handlePurchase} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-4">
      <ThreeScene gameState={threeSceneState} onRescueComplete={handleRescueComplete} />
      
      <div className="relative z-10 max-w-4xl mx-auto space-y-4">
        {/* HUD */}
        <Card className="p-4 backdrop-blur-sm bg-white/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Level</div>
              <div className="text-2xl font-bold">{gameState.level}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Score</div>
              <div className="text-2xl font-bold">{gameState.score}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Moves</div>
              <div className="text-2xl font-bold">{gameState.moves}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Target</div>
              <div className="text-2xl font-bold">{gameState.target}</div>
            </div>
          </div>
          
          <Progress value={(gameState.score / gameState.target) * 100} className="h-3" />
          
          {account && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span>{account.slice(0, 8)}...{account.slice(-6)}</span>
              <span className="font-bold">{parseFloat(fuBalance).toFixed(2)} F.U</span>
            </div>
          )}
        </Card>

        {/* Game Grid */}
        <Card className="p-4 backdrop-blur-sm bg-white/80">
          <div className="grid gap-1" style={{ 
            gridTemplateColumns: `repeat(${GAME_CONFIG.GRID_SIZE}, minmax(0, 1fr))` 
          }}>
            {grid.map((row, rowIdx) =>
              row.map((cell, colIdx) => (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={getCellClassName(rowIdx, colIdx)}
                  onClick={() => handleCellClick(rowIdx, colIdx)}
                >
                  {getGemDisplay(cell)}
                  {cell.obstacle && (
                    <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                      {cell.obstacle === 'ice' && '❄️'}
                      {cell.obstacle === 'lock' && '🔒'}
                      {cell.obstacle === 'stone' && '🪨'}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={() => setShowLevelMap(true)} variant="outline" className="flex-1">
            <Home className="w-4 h-4 mr-2" />
            Map
          </Button>
          <Button onClick={() => setShowShop(true)} variant="outline" className="flex-1">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Shop
          </Button>
        </div>
      </div>

      {/* Win/Lose Dialogs */}
      <Dialog open={gameState.gameStatus === 'won'} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">🎉 Level Complete!</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
            <p className="text-lg">Score: {gameState.score}</p>
            <div className="flex gap-2">
              <Button onClick={() => setShowLevelMap(true)} variant="outline" className="flex-1">
                Map
              </Button>
              <Button onClick={() => startLevel(gameState.level + 1)} className="flex-1">
                Next Level
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={gameState.gameStatus === 'lost'} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">😢 Level Failed</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p>Score: {gameState.score} / {gameState.target}</p>
            <div className="flex gap-2">
              <Button onClick={() => setShowLevelMap(true)} variant="outline" className="flex-1">
                Map
              </Button>
              <Button onClick={() => startLevel(gameState.level)} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={gameState.gameStatus === 'rescued'} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">👑 Princess Rescued! 💖</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="text-6xl">🎊</div>
            <p className="text-lg">Congratulations! You've completed all levels!</p>
            <p>Final Score: {gameState.score}</p>
            <Button onClick={() => setShowLevelMap(true)} className="w-full">
              Return to Map
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Shop isOpen={showShop} onClose={() => setShowShop(false)} onPurchase={handlePurchase} />
    </div>
  );
}
