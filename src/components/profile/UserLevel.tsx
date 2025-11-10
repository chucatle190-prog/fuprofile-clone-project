import { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Star } from "lucide-react";
import { Progress } from "../ui/progress";

interface UserLevelProps {
  userId: string;
}

const UserLevel = ({ userId }: UserLevelProps) => {
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLevel();
  }, [userId]);

  const fetchLevel = async () => {
    try {
      const { data, error } = await supabase
        .from("user_levels")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        setLevel(data.level);
        setExperience(data.experience_points);
      }
    } catch (error) {
      console.error("Error fetching level:", error);
    } finally {
      setLoading(false);
    }
  };

  const experienceForNextLevel = level * 100;
  const experienceInCurrentLevel = experience % 100;
  const progressPercent = (experienceInCurrentLevel / 100) * 100;

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Đang tải...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Cấp độ</h3>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" />
            <span className="text-2xl font-bold text-primary">Lv. {level}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Kinh nghiệm</span>
            <span className="font-semibold">
              {experienceInCurrentLevel} / 100 XP
            </span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-xs text-muted-foreground text-center">
            Còn {100 - experienceInCurrentLevel} XP để lên cấp {level + 1}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{experience}</p>
            <p className="text-xs text-muted-foreground">Tổng XP</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{level}</p>
            <p className="text-xs text-muted-foreground">Cấp độ</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default UserLevel;
