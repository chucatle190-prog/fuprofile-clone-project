import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDailyTaskTracker = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;

    // Track posts
    const postsChannel = supabase
      .channel(`posts_tracker_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          await updateDailyTask(userId, "post_created", true);
        }
      )
      .subscribe();

    // Track group posts (messages)
    const groupPostsChannel = supabase
      .channel(`group_posts_tracker_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_posts",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          await updateDailyTask(userId, "messages_sent", true);
        }
      )
      .subscribe();

    // Track messages
    const messagesChannel = supabase
      .channel(`messages_tracker_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${userId}`,
        },
        async () => {
          await updateDailyTask(userId, "messages_sent", true);
        }
      )
      .subscribe();

    // Track game scores
    const gamesChannel = supabase
      .channel(`games_tracker_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_scores",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          await incrementGamePlayed(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(groupPostsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(gamesChannel);
    };
  }, [userId]);
};

const updateDailyTask = async (
  userId: string,
  field: "post_created" | "messages_sent",
  value: boolean
) => {
  const today = new Date().toISOString().split("T")[0];

  try {
    // Check if task record exists for today
    const { data: existing } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("task_date", today)
      .maybeSingle();

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from("daily_tasks")
        .update({ [field]: value })
        .eq("id", existing.id);

      if (error) throw error;

      // Check if task completed and add reward
      if (!existing[field] && value) {
        await addReward(userId, "daily_task", 5, `Hoàn thành nhiệm vụ: ${field === "post_created" ? "Đăng bài" : "Nhắn tin"}`);
        toast.success(`✅ +5 BTC: ${field === "post_created" ? "Đăng bài hàng ngày" : "Nhắn tin hàng ngày"}!`);
      }

      // Check if all tasks completed for streak
      await checkAndUpdateStreak(userId, existing);
    } else {
      // Create new record with streak calculation
      const { data: yesterday } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("user_id", userId)
        .order("task_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      let streakCount = 1;
      if (yesterday) {
        const yesterdayDate = new Date(yesterday.task_date);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate.getTime() - yesterdayDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1 && yesterday.post_created && yesterday.games_played >= 2 && yesterday.messages_sent) {
          streakCount = (yesterday.streak_count || 0) + 1;
        }
      }

      const { error } = await supabase.from("daily_tasks").insert({
        user_id: userId,
        task_date: today,
        [field]: value,
        streak_count: streakCount,
        last_streak_date: today,
      });

      if (error) throw error;

      await addReward(userId, "daily_task", 5, `Hoàn thành nhiệm vụ: ${field === "post_created" ? "Đăng bài" : "Nhắn tin"}`);
      toast.success(`✅ +5 BTC: ${field === "post_created" ? "Đăng bài hàng ngày" : "Nhắn tin hàng ngày"}!`);
    }
  } catch (error) {
    console.error("Error updating daily task:", error);
  }
};

const incrementGamePlayed = async (userId: string) => {
  const today = new Date().toISOString().split("T")[0];

  try {
    const { data: existing } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("task_date", today)
      .maybeSingle();

    const newGamesPlayed = (existing?.games_played || 0) + 1;

    if (existing) {
      const { error } = await supabase
        .from("daily_tasks")
        .update({ games_played: newGamesPlayed })
        .eq("id", existing.id);

      if (error) throw error;

      // Check if reached 2 games
      if (existing.games_played < 2 && newGamesPlayed >= 2) {
        await addReward(userId, "daily_task", 5, "Hoàn thành nhiệm vụ: Chơi 2 minigame");
        toast.success("✅ +5 BTC: Chơi 2 minigame hàng ngày!");
      }

      await checkAndUpdateStreak(userId, { ...existing, games_played: newGamesPlayed });
    } else {
      // Create new record
      const { data: yesterday } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("user_id", userId)
        .order("task_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      let streakCount = 1;
      if (yesterday) {
        const yesterdayDate = new Date(yesterday.task_date);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate.getTime() - yesterdayDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1 && yesterday.post_created && yesterday.games_played >= 2 && yesterday.messages_sent) {
          streakCount = (yesterday.streak_count || 0) + 1;
        }
      }

      const { error } = await supabase.from("daily_tasks").insert({
        user_id: userId,
        task_date: today,
        games_played: newGamesPlayed,
        streak_count: streakCount,
        last_streak_date: today,
      });

      if (error) throw error;

      if (newGamesPlayed >= 2) {
        await addReward(userId, "daily_task", 5, "Hoàn thành nhiệm vụ: Chơi 2 minigame");
        toast.success("✅ +5 BTC: Chơi 2 minigame hàng ngày!");
      }
    }
  } catch (error) {
    console.error("Error incrementing game played:", error);
  }
};

const checkAndUpdateStreak = async (userId: string, taskData: any) => {
  const allCompleted = taskData.post_created && taskData.games_played >= 2 && taskData.messages_sent;
  
  if (allCompleted && taskData.streak_count && taskData.streak_count > 1) {
    const bonusReward = taskData.streak_count * 2; // 2 BTC per day in streak
    await addReward(userId, "streak_bonus", bonusReward, `Streak ${taskData.streak_count} ngày liên tiếp`);
    toast.success(`🔥 Streak Bonus: +${bonusReward} BTC cho ${taskData.streak_count} ngày liên tiếp!`, {
      duration: 5000,
    });
  }
};

const addReward = async (
  userId: string,
  rewardType: string,
  amount: number,
  description: string
) => {
  try {
    await supabase.from("reward_history").insert({
      user_id: userId,
      reward_type: rewardType,
      amount,
      description,
    });
  } catch (error) {
    console.error("Error adding reward:", error);
  }
};
