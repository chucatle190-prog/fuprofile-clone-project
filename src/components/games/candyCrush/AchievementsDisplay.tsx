import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  description: string;
  icon: string;
  current_progress: number;
  target_progress: number;
  earned_at?: string;
}

interface AchievementsDisplayProps {
  userId: string | null;
  onAchievementUnlocked?: (achievement: Achievement) => void;
}

const ACHIEVEMENT_DEFINITIONS = [
  {
    type: 'hammer_master',
    name: 'Master Hammer',
    description: 'Sử dụng Búa Sấm 10 lần',
    icon: '⚡',
    target: 10,
  },
  {
    type: 'rainbow_expert',
    name: 'Rainbow Expert',
    description: 'Sử dụng Cầu Vồng 10 lần',
    icon: '🌈',
    target: 10,
  },
  {
    type: 'wind_lord',
    name: 'Wind Lord',
    description: 'Sử dụng Gió Hoàng Gia 10 lần',
    icon: '🌪️',
    target: 10,
  },
  {
    type: 'move_master',
    name: 'Move Master',
    description: 'Sử dụng +5 Lượt 5 lần',
    icon: '➕',
    target: 5,
  },
  {
    type: 'ice_breaker_pro',
    name: 'Ice Breaker Pro',
    description: 'Sử dụng Băng Hộ Mệnh 10 lần',
    icon: '❄️',
    target: 10,
  },
  {
    type: 'level_10_complete',
    name: 'Halfway Hero',
    description: 'Hoàn thành màn 10',
    icon: '🏆',
    target: 1,
  },
  {
    type: 'level_20_complete',
    name: 'Princess Savior',
    description: 'Hoàn thành tất cả 20 màn',
    icon: '👑',
    target: 1,
  },
];

export default function AchievementsDisplay({ userId, onAchievementUnlocked }: AchievementsDisplayProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadAchievements();
    }
  }, [userId]);

  const loadAchievements = async () => {
    if (!userId) return;

    try {
      // @ts-ignore - Table will exist after migration
      const { data, error } = await (supabase as any)
        .from('candy_crush_achievements')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading achievements:', error);
        return;
      }

      setAchievements(data || []);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const updateAchievementProgress = async (type: string, increment: number = 1) => {
    if (!userId) return;

    const definition = ACHIEVEMENT_DEFINITIONS.find(a => a.type === type);
    if (!definition) return;

    // Get current achievement
    // @ts-ignore - Table will exist after migration
    const { data: existing } = await (supabase as any)
      .from('candy_crush_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_type', type)
      .single();

    const currentProgress = existing?.current_progress || 0;
    const newProgress = currentProgress + increment;
    const isCompleted = newProgress >= definition.target;

    if (existing) {
      // Update existing
      // @ts-ignore - Table will exist after migration
      const { error } = await (supabase as any)
        .from('candy_crush_achievements')
        .update({
          current_progress: newProgress,
          earned_at: isCompleted ? new Date().toISOString() : existing.earned_at,
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating achievement:', error);
      }
    } else {
      // Create new
      // @ts-ignore - Table will exist after migration
      const { error } = await (supabase as any)
        .from('candy_crush_achievements')
        .insert({
          user_id: userId,
          achievement_type: type,
          achievement_name: definition.name,
          description: definition.description,
          icon: definition.icon,
          current_progress: newProgress,
          target_progress: definition.target,
          earned_at: isCompleted ? new Date().toISOString() : null,
        });

      if (error) {
        console.error('Error creating achievement:', error);
      }
    }

    // Check if just unlocked
    if (isCompleted && currentProgress < definition.target) {
      toast({
        title: `🎉 Achievement Unlocked!`,
        description: `${definition.icon} ${definition.name}`,
      });
      
      if (onAchievementUnlocked) {
        onAchievementUnlocked({
          id: type,
          achievement_type: type,
          achievement_name: definition.name,
          description: definition.description,
          icon: definition.icon,
          current_progress: newProgress,
          target_progress: definition.target,
          earned_at: new Date().toISOString(),
        });
      }
    }

    loadAchievements();
  };

  const getAchievementStatus = (type: string) => {
    const achievement = achievements.find(a => a.achievement_type === type);
    const definition = ACHIEVEMENT_DEFINITIONS.find(a => a.type === type);
    
    if (!definition) return null;
    
    const progress = achievement?.current_progress || 0;
    const isEarned = achievement?.earned_at != null;
    
    return {
      ...definition,
      progress,
      isEarned,
    };
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        size="sm"
        className="fixed top-20 right-4 z-50 shadow-lg"
      >
        <Trophy className="w-4 h-4 mr-2" />
        Thành tích
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              🏆 Thành Tích
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ACHIEVEMENT_DEFINITIONS.map((def) => {
              const status = getAchievementStatus(def.type);
              if (!status) return null;

              return (
                <Card
                  key={def.type}
                  className={`p-4 ${
                    status.isEarned
                      ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-400'
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">{def.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">{def.name}</h3>
                        {status.isEarned && (
                          <Badge variant="default" className="bg-yellow-500">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {def.description}
                      </p>
                      <div className="text-xs font-mono text-muted-foreground">
                        {status.progress} / {def.target}
                      </div>
                      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${Math.min((status.progress / def.target) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Export function to update achievements from parent component
export { ACHIEVEMENT_DEFINITIONS };
