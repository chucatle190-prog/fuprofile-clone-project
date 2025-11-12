import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Match3Engine, type Cell } from "./GameEngine";
import { getNextMoveTowardsPrincess } from "./PathFinding";
import { GAME_CONFIG, SHOP_CONFIG, TREASURY_ADDRESS } from "@/config/gameConfig";
import { useToast } from "@/hooks/use-toast";
import { useFUToken } from "@/hooks/useFUToken";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { supabase } from "@/integrations/supabase/client";
import Shop from "./Shop";
import ThreeScene from "./ThreeScene";
import TutorialOverlay from "./TutorialOverlay";
import ParticleEffects, { type ParticleType } from "./ParticleEffects";
import AchievementsDisplay from "./AchievementsDisplay";
import { ShoppingBag, Wallet, Home, Trophy, X, Zap, Rainbow, Wind, Plus, Snowflake } from "lucide-react";

interface GameState {
  level: number;
  score: number;
  moves: number;
  target: number;
  isPlaying: boolean;
  gameStatus: 'playing' | 'won' | 'lost' | 'rescuing' | 'rescued';
}

type ToolMode = 'none' | 'hammer' | 'rainbow' | 'windRow' | 'windCol' | 'addMoves' | 'antiIce';

interface InventoryItem {
  key: string;
  name: string;
  icon: any;
  count: number;
  price: number;
  description: string;
}

export default function CandyCrushGame() {
  const [engine] = useState(() => new Match3Engine());
  const [grid, setGrid] = useState<Cell[][]>(engine.grid);
  const [princePosition, setPrincePosition] = useState<[number, number]>(engine.princePosition);
  const [princessPosition, setPrincessPosition] = useState<[number, number]>(engine.princessPosition);
  const [princeMoving, setPrinceMoving] = useState(false);
  
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
  const [threeSceneState, setThreeSceneState] = useState<'playing' | 'rescuing' | 'rescued'>('playing');
  
  // Inventory & Tool System
  const [inventory, setInventory] = useState<Record<string, number>>({
    THUNDER_HAMMER: 0,
    RAINBOW: 0,
    ROYAL_WIND: 0,
    EXTRA_MOVES: 0,
    ICE_BREAKER: 0,
  });
  const [toolMode, setToolMode] = useState<ToolMode>('none');
  const [windMode, setWindMode] = useState<'row' | 'col'>('row');
  const [selectedIceCells, setSelectedIceCells] = useState<[number, number][]>([]);
  const [toolHint, setToolHint] = useState<string>('');
  const [showRainbowPicker, setShowRainbowPicker] = useState(false);
  
  // New features
  const [showTutorial, setShowTutorial] = useState(false);
  const [particles, setParticles] = useState<Array<{id: string; x: number; y: number; type: ParticleType; timestamp: number}>>([]);
  const [highestLevelCompleted, setHighestLevelCompleted] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [achievementUsage, setAchievementUsage] = useState<Record<string, number>>({});
  
  const { toast } = useToast();
  const { account, fuBalance, connectWallet, transferFU, isConnecting, switchToBSCTestnet, isCorrectNetwork } = useFUToken();
  const { playSound } = useSoundEffects();
  
  // Load user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);
  
  // Load progress from localStorage and Supabase
  useEffect(() => {
    const loadProgress = async () => {
      // Load from localStorage
      const saved = localStorage.getItem('candyCrushProgress');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setHighestLevelCompleted(data.highestLevelCompleted || 0);
          setInventory(data.inventory || inventory);
          setShowTutorial(!data.tutorialCompleted);
        } catch (e) {
          console.error('Error loading progress:', e);
        }
      } else {
        setShowTutorial(true);
      }
      
      // Load from Supabase if user is logged in
      if (userId) {
        try {
          // @ts-ignore - Table will exist after migration
          const { data } = await (supabase as any)
            .from('candy_crush_progress')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (data) {
            setHighestLevelCompleted(data.highest_level || 0);
            if (data.inventory) {
              setInventory(data.inventory);
            }
            setShowTutorial(!data.tutorial_completed);
          }
        } catch (error) {
          console.error('Error loading progress from Supabase:', error);
        }
      }
    };
    
    loadProgress();
  }, [userId]);
  
  // Save progress to localStorage and Supabase
  const saveProgress = useCallback(async (levelCompleted?: number) => {
    const levelToSave = levelCompleted !== undefined ? levelCompleted : highestLevelCompleted;
    
    const progressData = {
      highestLevelCompleted: levelToSave,
      inventory,
      tutorialCompleted: !showTutorial,
    };
    
    // Save to localStorage
    localStorage.setItem('candyCrushProgress', JSON.stringify(progressData));
    
    // Save to Supabase if user is logged in
    if (userId) {
      try {
        // @ts-ignore - Table will exist after migration
        const { error } = await (supabase as any)
          .from('candy_crush_progress')
          .upsert({
            user_id: userId,
            highest_level: levelToSave,
            inventory: inventory,
            tutorial_completed: !showTutorial,
            updated_at: new Date().toISOString(),
          });
        
        if (error) {
          console.error('Error saving progress:', error);
        } else {
          console.log('Progress saved successfully:', levelToSave);
        }
      } catch (error) {
        console.error('Error saving progress to Supabase:', error);
      }
    }
  }, [highestLevelCompleted, inventory, showTutorial, userId]);
  
  // Auto-save progress periodically
  useEffect(() => {
    const interval = setInterval(() => saveProgress(), 10000); // Save every 10 seconds
    return () => clearInterval(interval);
  }, [saveProgress]);
  
  // Realtime sync for multi-device support
  useEffect(() => {
    if (!userId) return;
    
    const channel = supabase
      .channel('candy-crush-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candy_crush_progress',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Realtime update:', payload);
          if (payload.new && payload.new.user_id === userId) {
            const data = payload.new as any;
            setHighestLevelCompleted(data.highest_level || 0);
            if (data.inventory) {
              setInventory(data.inventory);
            }
            setShowTutorial(!data.tutorial_completed);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
  
  // Particle effect helper
  const addParticle = (x: number, y: number, type: ParticleType) => {
    const id = `${Date.now()}-${Math.random()}`;
    setParticles(prev => [...prev, { id, x, y, type, timestamp: Date.now() }]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id));
    }, 2500);
  };
  
  // Achievement tracking helper
  const trackAchievement = async (type: string) => {
    setAchievementUsage(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + 1,
    }));
    
    if (userId) {
      // Update achievement in Supabase via AchievementsDisplay component
      // The component will handle the database update
    }
  };
  
  // Move Prince after successful match
  const movePrinceAfterMatch = useCallback(async () => {
    if (princeMoving) return;
    
    // Check if prince already reached princess
    if (princePosition[0] === princessPosition[0] && princePosition[1] === princessPosition[1]) {
      return;
    }
    
    setPrinceMoving(true);
    
    // Calculate next position moving toward princess
    const nextPos = getNextMoveTowardsPrincess(
      engine.grid,
      princePosition,
      princessPosition,
      1 // Move 1 step at a time
    );
    
    // Animate movement
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setPrincePosition(nextPos);
    engine.princePosition = nextPos;
    
    // Check if reached princess
    if (nextPos[0] === princessPosition[0] && nextPos[1] === princessPosition[1]) {
      playSound('win');
      setThreeSceneState('rescuing');
      
      // Trigger win after a short delay
      setTimeout(() => {
        checkGameStatus();
      }, 500);
    }
    
    setPrinceMoving(false);
  }, [princePosition, princessPosition, engine, princeMoving]);

  const startLevel = (levelNum: number) => {
    // Check if level is locked
    if (levelNum > 1 && levelNum > highestLevelCompleted + 1) {
      toast({
        title: "Màn bị khóa! 🔒",
        description: `Hoàn thành màn ${levelNum - 1} trước`,
        variant: "destructive",
      });
      return;
    }
    
    const levelConfig = GAME_CONFIG.LEVELS[levelNum - 1];
    engine.grid = engine.initializeGrid();
    
    // Reset Prince and Princess positions
    engine.princePosition = [engine.size - 1, 0];
    engine.princessPosition = [0, engine.size - 1];
    setPrincePosition([engine.size - 1, 0]);
    setPrincessPosition([0, engine.size - 1]);
    setPrinceMoving(false);
    
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

  const handlePurchase = async (itemKey: string) => {
    const newCount = (inventory[itemKey] || 0) + 1;
    setInventory(prev => ({
      ...prev,
      [itemKey]: newCount,
    }));
    
    toast({
      title: "Mua thành công! 🎉",
      description: `+1 ${SHOP_CONFIG[itemKey as keyof typeof SHOP_CONFIG].name}`,
    });
  };

  // Tool System Functions
  const activateTool = (tool: ToolMode, itemKey: string) => {
    if (isAnimating) {
      toast({
        title: "Đang xử lý",
        description: "Vui lòng đợi animation hoàn tất",
        variant: "destructive",
      });
      return;
    }

    if (inventory[itemKey] <= 0) {
      toast({
        title: "Không đủ vật phẩm",
        description: "Vui lòng mua thêm trong Shop",
        variant: "destructive",
      });
      return;
    }

    setToolMode(tool);
    
    switch (tool) {
      case 'hammer':
        setToolHint('⚡ Chọn 1 ô để phá');
        break;
      case 'rainbow':
        setShowRainbowPicker(true);
        setToolHint('🌈 Chọn 1 loại kẹo để xóa toàn bản đồ');
        break;
      case 'windRow':
      case 'windCol':
        setToolHint(`🌪️ Chọn ${tool === 'windRow' ? 'Hàng' : 'Cột'} → chạm ô bất kỳ`);
        break;
      case 'addMoves':
        // Apply immediately
        playSound('moves');
        addParticle(window.innerWidth / 2, window.innerHeight / 3, 'stars');
        setGameState(prev => ({ ...prev, moves: prev.moves + 5 }));
        setInventory(prev => ({ ...prev, EXTRA_MOVES: prev.EXTRA_MOVES - 1 }));
        setToolMode('none');
        trackAchievement('move_master');
        toast({
          title: "Đã cộng 5 lượt! ➕",
        });
        return;
      case 'antiIce':
        setToolHint('❄️ Chọn tối đa 5 ô băng/khóa, rồi nhấn Xác nhận');
        break;
    }
  };

  const cancelToolMode = () => {
    setToolMode('none');
    setToolHint('');
    setSelectedIceCells([]);
    setShowRainbowPicker(false);
  };

  const applyHammer = (row: number, col: number) => {
    playSound('hammer');
    
    // Get cell position for particle effect
    const cellElement = document.querySelector(`[data-cell="${row}-${col}"]`);
    if (cellElement) {
      const rect = cellElement.getBoundingClientRect();
      addParticle(rect.left + rect.width / 2, rect.top + rect.height / 2, 'lightning');
    }
    
    engine.grid[row][col].gem = null;
    engine.grid[row][col].isEmpty = true;
    
    if (engine.grid[row][col].obstacle) {
      engine.grid[row][col].obstacleHealth = 0;
      engine.grid[row][col].obstacle = null;
    }
    
    setGrid([...engine.grid]);
    setInventory(prev => ({ ...prev, THUNDER_HAMMER: prev.THUNDER_HAMMER - 1 }));
    cancelToolMode();
    trackAchievement('hammer_master');
    
    setTimeout(() => processCascade(), 300);
    
    toast({
      title: "Búa Sấm! ⚡",
      description: "Đã phá ô thành công",
    });
  };

  const applyRainbow = async (gemType: number) => {
    playSound('rainbow');
    addParticle(window.innerWidth / 2, window.innerHeight / 2, 'rainbow');
    
    let clearedCount = 0;
    
    for (let row = 0; row < engine.size; row++) {
      for (let col = 0; col < engine.size; col++) {
        if (engine.grid[row][col].gem === gemType) {
          engine.grid[row][col].gem = null;
          engine.grid[row][col].isEmpty = true;
          clearedCount++;
        }
      }
    }
    
    setGrid([...engine.grid]);
    setInventory(prev => ({ ...prev, RAINBOW: prev.RAINBOW - 1 }));
    setGameState(prev => ({ ...prev, moves: prev.moves - 1 }));
    cancelToolMode();
    trackAchievement('rainbow_expert');
    
    await processCascade();
    
    toast({
      title: "Cầu Vồng! 🌈",
      description: `Đã xóa ${clearedCount} viên kẹo`,
    });
  };

  const applyWind = async (row: number, col: number) => {
    playSound('wind');
    
    const cellElement = document.querySelector(`[data-cell="${row}-${col}"]`);
    if (cellElement) {
      const rect = cellElement.getBoundingClientRect();
      addParticle(rect.left + rect.width / 2, rect.top + rect.height / 2, 'wind');
    }
    
    if (toolMode === 'windRow') {
      for (let c = 0; c < engine.size; c++) {
        engine.grid[row][c].gem = null;
        engine.grid[row][c].isEmpty = true;
      }
    } else {
      for (let r = 0; r < engine.size; r++) {
        engine.grid[r][col].gem = null;
        engine.grid[r][col].isEmpty = true;
      }
    }
    
    setGrid([...engine.grid]);
    setInventory(prev => ({ ...prev, ROYAL_WIND: prev.ROYAL_WIND - 1 }));
    setGameState(prev => ({ ...prev, moves: prev.moves - 1 }));
    cancelToolMode();
    trackAchievement('wind_lord');
    
    await processCascade();
    
    toast({
      title: "Gió Hoàng Gia! 🌪️",
      description: `Đã xóa ${toolMode === 'windRow' ? 'hàng' : 'cột'}`,
    });
  };

  const applyAntiIce = () => {
    if (selectedIceCells.length === 0) {
      toast({
        title: "Chưa chọn ô nào",
        variant: "destructive",
      });
      return;
    }

    playSound('ice');
    
    for (const [row, col] of selectedIceCells) {
      const cellElement = document.querySelector(`[data-cell="${row}-${col}"]`);
      if (cellElement) {
        const rect = cellElement.getBoundingClientRect();
        addParticle(rect.left + rect.width / 2, rect.top + rect.height / 2, 'ice');
      }
      
      if (engine.grid[row][col].obstacle) {
        engine.grid[row][col].obstacleHealth = 0;
        engine.grid[row][col].obstacle = null;
      }
    }
    
    setGrid([...engine.grid]);
    setInventory(prev => ({ ...prev, ICE_BREAKER: prev.ICE_BREAKER - 1 }));
    cancelToolMode();
    trackAchievement('ice_breaker_pro');
    
    toast({
      title: "Băng Hộ Mệnh! ❄️",
      description: `Đã phá ${selectedIceCells.length} ô`,
    });
  };

  const handleCellClick = (row: number, col: number) => {
    if (!gameState.isPlaying || isAnimating) return;

    // Handle tool mode
    if (toolMode !== 'none') {
      switch (toolMode) {
        case 'hammer':
          applyHammer(row, col);
          break;
        case 'rainbow':
          // Handled by picker
          break;
        case 'windRow':
        case 'windCol':
          applyWind(row, col);
          break;
        case 'antiIce':
          if (engine.grid[row][col].obstacle) {
            const cellKey = `${row},${col}`;
            const isSelected = selectedIceCells.some(([r, c]) => r === row && c === col);
            
            if (isSelected) {
              setSelectedIceCells(prev => prev.filter(([r, c]) => r !== row || c !== col));
            } else if (selectedIceCells.length < 5) {
              setSelectedIceCells(prev => [...prev, [row, col]]);
            } else {
              toast({
                title: "Tối đa 5 ô",
                variant: "destructive",
              });
            }
          }
          break;
      }
      return;
    }

    // Normal swap logic
    if (!selectedCell) {
      setSelectedCell([row, col]);
    } else {
      const [selRow, selCol] = selectedCell;
      
      if (row === selRow && col === selCol) {
        setSelectedCell(null);
        return;
      }

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
    let hadAnyMatches = false;
    
    while (hasMatches) {
      const matches = engine.findMatches();
      
      if (matches.length === 0) {
        hasMatches = false;
        break;
      }
      
      hadAnyMatches = true;
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
    
    // Move prince after successful matches
    if (hadAnyMatches && totalScore > 0) {
      await movePrinceAfterMatch();
    }
  };

  const checkGameStatus = () => {
    setGameState(prev => {
      // Check if Prince reached Princess - NEW WIN CONDITION
      if (princePosition[0] === princessPosition[0] && princePosition[1] === princessPosition[1]) {
        playSound('win');
        
        // Update highest level completed
        const newHighestLevel = Math.max(prev.level, highestLevelCompleted);
        if (prev.level > highestLevelCompleted) {
          setHighestLevelCompleted(newHighestLevel);
          
          // Track achievement for level completion
          if (prev.level === 10) {
            trackAchievement('level_10_complete');
          } else if (prev.level === 20) {
            trackAchievement('level_20_complete');
          }
          
          // Save progress with the new level
          setTimeout(() => saveProgress(newHighestLevel), 100);
        }
        
        // Check if final level
        if (prev.level === 20) {
          setThreeSceneState('rescuing');
          return { ...prev, gameStatus: 'rescuing', isPlaying: false };
        }
        return { ...prev, gameStatus: 'won', isPlaying: false };
      } else if (prev.moves <= 0) {
        playSound('lose');
        return { ...prev, gameStatus: 'lost', isPlaying: false };
      }
      return prev;
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
              {GAME_CONFIG.LEVELS.map((level, idx) => {
                const isLocked = idx > 0 && idx > highestLevelCompleted;
                const isCompleted = idx < highestLevelCompleted;
                
                return (
                  <Button
                    key={idx}
                    onClick={() => startLevel(idx + 1)}
                    className="h-16 relative"
                    variant={idx === 0 ? "default" : "outline"}
                    disabled={isLocked}
                  >
                    <div className="text-center">
                      <div className="text-2xl">
                        {isLocked ? '🔒' : (idx + 1) % 5 === 0 ? '👹' : '🏰'}
                      </div>
                      <div className="text-xs">{idx + 1}</div>
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1">
                          <span className="text-xs">✅</span>
                        </div>
                      )}
                    </div>
                  </Button>
                );
              })}
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
      <div className="relative z-10 max-w-4xl mx-auto space-y-4">
        {/* Prince 3D at top */}
        <div className="h-40 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border-2 border-blue-400/30 shadow-xl">
          <ThreeScene gameState={threeSceneState} onRescueComplete={handleRescueComplete} characterType="prince" />
        </div>
        {/* Fixed Shop Button - Top Right */}
        <div className="fixed top-4 right-4 z-50">
          <Button 
            onClick={() => setShowShop(true)} 
            size="lg"
            className="shadow-lg hover:scale-110 transition-transform"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            🪄 Shop
          </Button>
        </div>

        {/* Tool Hint Overlay */}
        {toolMode !== 'none' && toolHint && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
            <Card className="p-4 bg-yellow-50 border-2 border-yellow-400 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{toolHint}</span>
                <Button size="sm" variant="ghost" onClick={cancelToolMode}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        )}

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
              row.map((cell, colIdx) => {
                const isIceSelected = selectedIceCells.some(([r, c]) => r === rowIdx && c === colIdx);
                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    data-cell={`${rowIdx}-${colIdx}`}
                    className={`${getCellClassName(rowIdx, colIdx)} ${
                      isIceSelected ? 'ring-4 ring-blue-400' : ''
                    } ${toolMode !== 'none' ? 'cursor-crosshair' : ''}`}
                    onClick={() => handleCellClick(rowIdx, colIdx)}
                  >
                    {/* Prince */}
                    {princePosition[0] === rowIdx && princePosition[1] === colIdx && (
                      <div className="absolute inset-0 flex items-center justify-center text-4xl z-20 animate-bounce">
                        🤴
                      </div>
                    )}
                    
                    {/* Princess */}
                    {princessPosition[0] === rowIdx && princessPosition[1] === colIdx && (
                      <div className="absolute inset-0 flex items-center justify-center text-4xl z-20">
                        <div className="relative animate-pulse">
                          👸
                          <div className="absolute -top-2 -right-2 text-xl">💖</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Gem */}
                    {!(princePosition[0] === rowIdx && princePosition[1] === colIdx) && 
                     !(princessPosition[0] === rowIdx && princessPosition[1] === colIdx) && 
                     getGemDisplay(cell)}
                    
                    {/* Obstacle */}
                    {cell.obstacle && (
                      <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                        {cell.obstacle === 'ice' && '❄️'}
                        {cell.obstacle === 'lock' && '🔒'}
                        {cell.obstacle === 'stone' && '🪨'}
                      </div>
                     )}
                   </div>
                 );
               })
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={() => setShowLevelMap(true)} variant="outline" className="flex-1">
            <Home className="w-4 h-4 mr-2" />
            Map
          </Button>
        </div>
        
        {/* Princess 3D at bottom */}
        <div className="h-40 rounded-lg overflow-hidden bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-sm border-2 border-pink-400/30 shadow-xl">
          <ThreeScene gameState={threeSceneState} onRescueComplete={handleRescueComplete} characterType="princess" />
        </div>
      </div>

      {/* Toolbelt - Fixed Bottom Right */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toolMode === 'antiIce' && selectedIceCells.length > 0 && (
          <Button 
            onClick={applyAntiIce}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Xác nhận ({selectedIceCells.length}/5)
          </Button>
        )}
        
        <Card className="p-3 bg-white/95 backdrop-blur-sm shadow-2xl">
          <div className="space-y-2 w-20 sm:w-24">
            {/* Thunder Hammer */}
            <div className="relative">
              <Button
                onClick={() => inventory.THUNDER_HAMMER > 0 ? activateTool('hammer', 'THUNDER_HAMMER') : setShowShop(true)}
                disabled={isAnimating || (toolMode !== 'none' && toolMode !== 'hammer')}
                className="w-full h-16 flex flex-col items-center justify-center gap-1 p-1"
                variant={toolMode === 'hammer' ? 'default' : 'outline'}
              >
                <Zap className="w-6 h-6" />
                <span className="text-xs">Búa</span>
              </Button>
              {inventory.THUNDER_HAMMER > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0">
                  {inventory.THUNDER_HAMMER}
                </Badge>
              )}
            </div>

            {/* Rainbow */}
            <div className="relative">
              <Button
                onClick={() => inventory.RAINBOW > 0 ? activateTool('rainbow', 'RAINBOW') : setShowShop(true)}
                disabled={isAnimating || (toolMode !== 'none' && toolMode !== 'rainbow')}
                className="w-full h-16 flex flex-col items-center justify-center gap-1 p-1"
                variant={toolMode === 'rainbow' ? 'default' : 'outline'}
              >
                <Rainbow className="w-6 h-6" />
                <span className="text-xs">Vồng</span>
              </Button>
              {inventory.RAINBOW > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0">
                  {inventory.RAINBOW}
                </Badge>
              )}
            </div>

            {/* Royal Wind */}
            <div className="relative">
              <Button
                onClick={() => {
                  if (inventory.ROYAL_WIND > 0) {
                    const mode = windMode === 'row' ? 'windRow' : 'windCol';
                    activateTool(mode, 'ROYAL_WIND');
                  } else {
                    setShowShop(true);
                  }
                }}
                disabled={isAnimating || (toolMode !== 'none' && toolMode !== 'windRow' && toolMode !== 'windCol')}
                className="w-full h-16 flex flex-col items-center justify-center gap-1 p-1"
                variant={toolMode === 'windRow' || toolMode === 'windCol' ? 'default' : 'outline'}
              >
                <Wind className="w-6 h-6" />
                <span className="text-xs">Gió</span>
              </Button>
              {inventory.ROYAL_WIND > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0">
                  {inventory.ROYAL_WIND}
                </Badge>
              )}
              {(toolMode === 'windRow' || toolMode === 'windCol') && (
                <Button
                  size="sm"
                  onClick={() => {
                    setWindMode(prev => prev === 'row' ? 'col' : 'row');
                    setToolMode(windMode === 'row' ? 'windCol' : 'windRow');
                  }}
                  className="absolute -left-16 top-0 text-xs"
                >
                  {windMode === 'row' ? 'Hàng' : 'Cột'}
                </Button>
              )}
            </div>

            {/* Extra Moves */}
            <div className="relative">
              <Button
                onClick={() => inventory.EXTRA_MOVES > 0 ? activateTool('addMoves', 'EXTRA_MOVES') : setShowShop(true)}
                disabled={isAnimating}
                className="w-full h-16 flex flex-col items-center justify-center gap-1 p-1"
                variant="outline"
              >
                <Plus className="w-6 h-6" />
                <span className="text-xs">+5</span>
              </Button>
              {inventory.EXTRA_MOVES > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0">
                  {inventory.EXTRA_MOVES}
                </Badge>
              )}
            </div>

            {/* Ice Breaker */}
            <div className="relative">
              <Button
                onClick={() => inventory.ICE_BREAKER > 0 ? activateTool('antiIce', 'ICE_BREAKER') : setShowShop(true)}
                disabled={isAnimating || (toolMode !== 'none' && toolMode !== 'antiIce')}
                className="w-full h-16 flex flex-col items-center justify-center gap-1 p-1"
                variant={toolMode === 'antiIce' ? 'default' : 'outline'}
              >
                <Snowflake className="w-6 h-6" />
                <span className="text-xs">Băng</span>
              </Button>
              {inventory.ICE_BREAKER > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0">
                  {inventory.ICE_BREAKER}
                </Badge>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Rainbow Gem Picker Dialog */}
      <Dialog open={showRainbowPicker} onOpenChange={() => {
        setShowRainbowPicker(false);
        cancelToolMode();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chọn loại kẹo để xóa</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 p-4">
            {GAME_CONFIG.GEM_SYMBOLS.map((gem, idx) => (
              <Button
                key={idx}
                onClick={() => {
                  applyRainbow(idx);
                  setShowRainbowPicker(false);
                }}
                className="h-20 text-4xl"
                variant="outline"
              >
                {gem}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Win/Lose Dialogs */}
      <Dialog open={gameState.gameStatus === 'won'} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">🎉 Hoàng tử đã cứu được Công chúa!</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
            <p className="text-lg">Màn {gameState.level} hoàn thành!</p>
            <p className="text-sm text-muted-foreground">Score: {gameState.score}</p>
            <div className="flex gap-2">
              <Button onClick={() => setShowLevelMap(true)} variant="outline" className="flex-1">
                Map
              </Button>
              {gameState.level < 20 && (
                <Button 
                  onClick={() => {
                    const nextLevel = gameState.level + 1;
                    const newHighest = Math.max(highestLevelCompleted, gameState.level);
                    setHighestLevelCompleted(newHighest);
                    saveProgress(newHighest).then(() => {
                      startLevel(nextLevel);
                    });
                  }} 
                  className="flex-1"
                >
                  Màn tiếp theo
                </Button>
              )}
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
      
      {/* Tutorial Overlay */}
      <TutorialOverlay 
        isOpen={showTutorial} 
        onComplete={() => {
          setShowTutorial(false);
          saveProgress();
        }} 
      />
      
      {/* Particle Effects */}
      <ParticleEffects particles={particles} />
      
      {/* Achievements Display */}
      {userId && <AchievementsDisplay userId={userId} />}
    </div>
  );
}
