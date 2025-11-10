import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle, Bitcoin } from "lucide-react";
import { Progress } from "../ui/progress";
import { toast } from "sonner";

interface DailyTasksProps {
  userId: string;
}

interface TaskProgress {
  post_created: boolean;
  games_played: number;
  messages_sent: boolean;
}

const DailyTasks = ({ userId }: DailyTasksProps) => {
  const [tasks, setTasks] = useState<TaskProgress>({
    post_created: false,
    games_played: 0,
    messages_sent: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const fetchTasks = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("task_date", today)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setTasks({
          post_created: data.post_created,
          games_played: data.games_played,
          messages_sent: data.messages_sent,
        });
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const completedTasks = [
    tasks.post_created,
    tasks.games_played >= 2,
    tasks.messages_sent,
  ].filter(Boolean).length;

  const totalReward = completedTasks * 5;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Đang tải...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            📋 Nhiệm vụ hàng ngày
          </span>
          <span className="flex items-center gap-1 text-yellow-500">
            <Bitcoin className="h-5 w-5" />
            {totalReward} BTC
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Tiến độ hôm nay</span>
            <span className="text-muted-foreground">
              {completedTasks}/3 nhiệm vụ
            </span>
          </div>
          <Progress value={(completedTasks / 3) * 100} className="h-2" />
        </div>

        <div className="space-y-3">
          {/* Task 1: Create Post */}
          <div
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              tasks.post_created
                ? "bg-primary/5 border-primary/20"
                : "bg-muted/30 border-muted"
            }`}
          >
            {tasks.post_created ? (
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">Đăng bài hàng ngày</p>
              <p className="text-xs text-muted-foreground">
                Đăng 1 bài viết trên trang cá nhân
              </p>
            </div>
            <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
              <Bitcoin className="h-4 w-4" />
              {tasks.post_created ? "5" : "+5"}
            </div>
          </div>

          {/* Task 2: Play Games */}
          <div
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              tasks.games_played >= 2
                ? "bg-primary/5 border-primary/20"
                : "bg-muted/30 border-muted"
            }`}
          >
            {tasks.games_played >= 2 ? (
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">Chơi 2 minigame</p>
              <p className="text-xs text-muted-foreground">
                Hoàn thành {tasks.games_played}/2 lượt chơi
              </p>
            </div>
            <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
              <Bitcoin className="h-4 w-4" />
              {tasks.games_played >= 2 ? "5" : "+5"}
            </div>
          </div>

          {/* Task 3: Send Messages */}
          <div
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              tasks.messages_sent
                ? "bg-primary/5 border-primary/20"
                : "bg-muted/30 border-muted"
            }`}
          >
            {tasks.messages_sent ? (
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">Nhắn tin hàng ngày</p>
              <p className="text-xs text-muted-foreground">
                Gửi tin nhắn cho nhóm hoặc bạn bè
              </p>
            </div>
            <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
              <Bitcoin className="h-4 w-4" />
              {tasks.messages_sent ? "5" : "+5"}
            </div>
          </div>
        </div>

        {completedTasks === 3 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border-2 border-yellow-500/20 text-center">
            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              🎉 Hoàn thành tất cả nhiệm vụ!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Bạn đã nhận được 15 BTC hôm nay
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyTasks;