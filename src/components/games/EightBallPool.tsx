import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PoolPhysics, Ball } from '@/utils/poolPhysics';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { RealtimeChannel } from '@supabase/supabase-js';

interface GameState {
  balls: Ball[];
  currentPlayer: number;
  players: string[];
  gameId: string;
  shooting: boolean;
}

interface PoolGame {
  id: string;
  group_id: string;
  player1_id: string;
  player2_id: string | null;
  current_player: number;
  game_state: any;
  status: 'waiting' | 'active' | 'completed';
  winner_id: string | null;
}

const EightBallPool = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const physicsRef = useRef<PoolPhysics | null>(null);
  const animationRef = useRef<number>();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<GameState>({
    balls: [],
    currentPlayer: 0,
    players: [],
    gameId: '',
    shooting: false,
  });

  const [poolGame, setPoolGame] = useState<PoolGame | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [aimAngle, setAimAngle] = useState(0);
  const [power, setPower] = useState(0);
  const [isAiming, setIsAiming] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cuePosition, setCuePosition] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Get current user and initialize/join game
  useEffect(() => {
    const initGame = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: 'Lỗi',
            description: 'Bạn cần đăng nhập để chơi',
            variant: 'destructive',
          });
          navigate(-1);
          return;
        }

        setCurrentUserId(user.id);

        // Check for existing waiting game
        const { data: waitingGames } = await supabase
          .from('pool_games')
          .select('*')
          .eq('group_id', groupId)
          .eq('status', 'waiting')
          .is('player2_id', null)
          .limit(1);

        if (waitingGames && waitingGames.length > 0) {
          // Join existing game
          const game = waitingGames[0];
          const { error } = await supabase
            .from('pool_games')
            .update({
              player2_id: user.id,
              status: 'active',
            })
            .eq('id', game.id);

          if (error) throw error;

          setPoolGame({ ...game, player2_id: user.id, status: 'active' } as PoolGame);
        } else {
          // Create new game
          const { data: newGame, error } = await supabase
            .from('pool_games')
            .insert({
              group_id: groupId!,
              player1_id: user.id,
              status: 'waiting',
            })
            .select()
            .single();

          if (error) throw error;
          setPoolGame(newGame as PoolGame);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing game:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể khởi tạo game',
          variant: 'destructive',
        });
        navigate(-1);
      }
    };

    initGame();
  }, [groupId, navigate, toast]);

  // Initialize canvas and physics
  useEffect(() => {
    if (!poolGame || poolGame.status !== 'active') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = Math.min(800, window.innerWidth - 40);
    const height = Math.min(400, window.innerHeight - 300);
    canvas.width = width;
    canvas.height = height;

    physicsRef.current = new PoolPhysics(width, height);
    setGameState((prev) => ({
      ...prev,
      balls: physicsRef.current!.balls,
      gameId: poolGame.id,
    }));

    // Animation loop
    const animate = () => {
      if (!physicsRef.current || !canvas) return;

      physicsRef.current.update();
      drawGame(canvas, physicsRef.current);

      // Check if balls stopped moving
      if (!physicsRef.current.isMoving() && gameState.shooting) {
        handleTurnEnd();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [poolGame, gameState.shooting]);

  // Setup realtime channel
  useEffect(() => {
    if (!poolGame) return;

    const channel = supabase
      .channel(`pool-game-${poolGame.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pool_games',
          filter: `id=eq.${poolGame.id}`,
        },
        (payload) => {
          const updatedGame = payload.new as PoolGame;
          setPoolGame(updatedGame);
          
          if (updatedGame.game_state?.balls && physicsRef.current) {
            physicsRef.current.balls = updatedGame.game_state.balls;
            setGameState((prev) => ({
              ...prev,
              currentPlayer: updatedGame.current_player,
              shooting: updatedGame.game_state.shooting,
              balls: updatedGame.game_state.balls,
            }));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [poolGame]);

  // Handle mouse/touch for aiming
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState.shooting || !physicsRef.current || !isMyTurn()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cueBall = physicsRef.current.getCueBall();
    if (!cueBall) return;

    // Check if click is near cue ball area
    const dx = x - cueBall.x;
    const dy = y - cueBall.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 150) {
      setMousePos({ x, y });
      setIsAiming(true);
      setIsDragging(true);
      const angle = Math.atan2(dy, dx);
      setAimAngle(angle);
      setCuePosition({ x: cueBall.x, y: cueBall.y });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isAiming || !physicsRef.current || !isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cueBall = physicsRef.current.getCueBall();
    if (!cueBall) return;

    const dx = x - cueBall.x;
    const dy = y - cueBall.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);

    setAimAngle(angle);
    // Power based on how far you drag (max 25)
    setPower(Math.min(distance / 4, 25));
    setMousePos({ x, y });
  };

  const handlePointerUp = async () => {
    if (!isAiming || !physicsRef.current || !poolGame) return;
    if (!isMyTurn()) return;

    setIsAiming(false);
    setIsDragging(false);

    if (power > 2) {
      physicsRef.current.shootCueBall(power, aimAngle);
      setGameState((prev) => ({ ...prev, shooting: true }));

      // Update game state in database
      await supabase
        .from('pool_games')
        .update({
          game_state: {
            balls: physicsRef.current.balls,
            shooting: true,
          } as any,
        })
        .eq('id', poolGame.id);

      toast({
        title: 'Đã đánh! 🎱',
        description: `Sức mạnh: ${Math.round(power)}`,
      });
    }

    setPower(0);
  };

  const handleTurnEnd = async () => {
    if (!poolGame || !physicsRef.current) return;

    const nextPlayer = poolGame.current_player === 0 ? 1 : 0;
    
    await supabase
      .from('pool_games')
      .update({
        current_player: nextPlayer,
        game_state: {
          balls: physicsRef.current.balls,
          shooting: false,
        } as any,
      })
      .eq('id', poolGame.id);

    setGameState((prev) => ({
      ...prev,
      shooting: false,
      currentPlayer: nextPlayer,
    }));
  };

  const isMyTurn = () => {
    if (!poolGame) return false;
    const isPlayer1 = currentUserId === poolGame.player1_id;
    const isPlayer2 = currentUserId === poolGame.player2_id;
    
    if (poolGame.current_player === 0 && isPlayer1) return true;
    if (poolGame.current_player === 1 && isPlayer2) return true;
    
    return false;
  };

  const drawGame = (canvas: HTMLCanvasElement, physics: PoolPhysics) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0D5E2E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw table border
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 20;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw pockets
    physics.pockets.forEach((pocket) => {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, pocket.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw balls
    physics.balls.forEach((ball) => {
      if (ball.pocketed) return;

      ctx.fillStyle = ball.color;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw ball number for stripes
      if (ball.type === 'stripe' && ball.number > 8) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw number
      if (ball.number > 0) {
        ctx.fillStyle = ball.type === 'solid' || ball.type === '8ball' ? '#FFFFFF' : '#000000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ball.number.toString(), ball.x, ball.y);
      }

      // Draw ball outline
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw aiming system
    if (isAiming && !gameState.shooting && isMyTurn()) {
      const cueBall = physics.getCueBall();
      if (cueBall) {
        // Draw aiming guideline (dotted line)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(cueBall.x, cueBall.y);
        const guideLength = 300;
        ctx.lineTo(
          cueBall.x + Math.cos(aimAngle) * guideLength,
          cueBall.y + Math.sin(aimAngle) * guideLength
        );
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw cue stick
        const cueLength = 150 + power * 3;
        const cueStartX = cueBall.x - Math.cos(aimAngle) * (50 + power * 2);
        const cueStartY = cueBall.y - Math.sin(aimAngle) * (50 + power * 2);
        const cueEndX = cueBall.x - Math.cos(aimAngle) * cueLength;
        const cueEndY = cueBall.y - Math.sin(aimAngle) * cueLength;

        // Cue stick gradient
        const gradient = ctx.createLinearGradient(cueStartX, cueStartY, cueEndX, cueEndY);
        gradient.addColorStop(0, '#D2691E');
        gradient.addColorStop(0.7, '#8B4513');
        gradient.addColorStop(1, '#654321');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cueStartX, cueStartY);
        ctx.lineTo(cueEndX, cueEndY);
        ctx.stroke();

        // Cue tip
        ctx.fillStyle = '#4169E1';
        ctx.beginPath();
        ctx.arc(cueStartX, cueStartY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw power bar at bottom
        const barWidth = 250;
        const barHeight = 30;
        const barX = (canvas.width - barWidth) / 2;
        const barY = canvas.height - 50;

        // Power bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

        // Power bar fill
        const powerPercent = Math.min(power / 25, 1);
        const powerGradient = ctx.createLinearGradient(barX, 0, barX + barWidth * powerPercent, 0);
        powerGradient.addColorStop(0, '#00FF00');
        powerGradient.addColorStop(0.5, '#FFFF00');
        powerGradient.addColorStop(1, '#FF0000');
        
        ctx.fillStyle = powerGradient;
        ctx.fillRect(barX, barY, barWidth * powerPercent, barHeight);

        // Power bar border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Power text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Lực: ${Math.round(power)}`, canvas.width / 2, barY - 10);
        ctx.fillText('Kéo cần gạt để điều chỉnh lực', canvas.width / 2, barY + barHeight + 20);
      }
    }
  };

  const resetGame = async () => {
    if (!physicsRef.current || !poolGame) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    physicsRef.current = new PoolPhysics(canvas.width, canvas.height);
    
    await supabase
      .from('pool_games')
      .update({
        current_player: 0,
        game_state: {
          balls: physicsRef.current.balls,
          shooting: false,
        } as any,
        status: 'active',
      })
      .eq('id', poolGame.id);

    setGameState({
      balls: physicsRef.current.balls,
      currentPlayer: 0,
      players: [],
      gameId: poolGame.id,
      shooting: false,
    });

    toast({
      title: 'Trò chơi mới! 🎱',
      description: 'Chúc may mắn!',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <Card className="p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-semibold">Đang tìm đối thủ...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!poolGame || poolGame.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <Card className="p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-semibold">Đang chờ người chơi thứ 2...</p>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Hủy
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold text-primary">🎱 8 Ball Pool</h1>
          <Button variant="outline" onClick={resetGame}>
            Chơi lại
          </Button>
        </div>

        <div className="grid md:grid-cols-[1fr_300px] gap-4">
          <Card className="p-4">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="w-full border-4 border-primary/20 rounded-lg cursor-crosshair touch-none"
              style={{ maxWidth: '100%', height: 'auto' }}
            />

            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm">
                {gameState.shooting ? (
                  <span className="text-muted-foreground">Đang đánh...</span>
                ) : isMyTurn() ? (
                  <span className="text-primary font-semibold">
                    Lượt của bạn 🎯
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Đang chờ đối thủ...
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {isMyTurn() ? 'Nhấn gần bi trắng và kéo để nhắm - Kéo xa = lực mạnh' : 'Chờ đối thủ đánh'}
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Người chơi
              </h3>
              <div className="space-y-2">
                <div className={`p-3 rounded-lg ${
                  poolGame.current_player === 0 ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  <div className="font-semibold flex items-center gap-2">
                    Người chơi 1
                    {currentUserId === poolGame.player1_id && <span className="text-xs">(Bạn)</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">Bi đặc (1-7)</div>
                </div>
                <div className={`p-3 rounded-lg ${
                  poolGame.current_player === 1 ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  <div className="font-semibold flex items-center gap-2">
                    Người chơi 2
                    {currentUserId === poolGame.player2_id && <span className="text-xs">(Bạn)</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">Bi sọc (9-15)</div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-2">Hướng dẫn</h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Nhấn gần bi trắng và kéo cần gạt</li>
                <li>• Kéo xa = lực mạnh hơn (tối đa 25)</li>
                <li>• Thanh lực hiển thị độ mạnh</li>
                <li>• Đưa bi của bạn vào lỗ</li>
                <li>• Cuối cùng đưa bi số 8 vào để thắng</li>
              </ul>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-2">Thống kê</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bi đặc còn lại:</span>
                  <span className="font-semibold">
                    {physicsRef.current?.balls.filter(b => b.type === 'solid' && !b.pocketed).length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bi sọc còn lại:</span>
                  <span className="font-semibold">
                    {physicsRef.current?.balls.filter(b => b.type === 'stripe' && !b.pocketed).length || 0}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EightBallPool;
