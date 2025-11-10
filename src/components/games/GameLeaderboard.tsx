import { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal } from "lucide-react";

interface GameLeaderboardProps {
  groupId: string;
  gameType: "spin_wheel" | "word_puzzle" | "memory_match";
}

interface LeaderboardEntry {
  id: string;
  user_id: string;
  score: number;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

const GameLeaderboard = ({ groupId, gameType }: GameLeaderboardProps) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from("game_scores")
        .select(`
          id,
          user_id,
          score,
          created_at
        `)
        .eq("group_id", groupId)
        .eq("game_type", gameType)
        .order("score", { ascending: false })
        .limit(10);

      if (!error && data) {
        // Fetch profiles separately
        const userIds = Array.from(new Set(data.map((s) => s.user_id)));
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);

        const profileMap = new Map(
          (profiles || []).map((p) => [p.id, p])
        );

        const enrichedData = data.map((score) => ({
          ...score,
          profiles:
            profileMap.get(score.user_id) ||
            { username: "Unknown", avatar_url: null },
        }));

        setLeaderboard(enrichedData as LeaderboardEntry[]);
      }

      if (error) {
        console.error("Error fetching leaderboard:", error);
      }
      
      setLoading(false);
    };

    fetchLeaderboard();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`leaderboard-${groupId}-${gameType}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_scores",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, gameType]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground">#{index + 1}</span>;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Đang tải...</p>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Chưa có điểm số nào. Hãy chơi game để trở thành người đầu tiên!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Bảng Xếp Hạng
        </h3>

        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                index < 3
                  ? "bg-primary/5 border-2 border-primary/20"
                  : "bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-center w-8">
                {getRankIcon(index)}
              </div>

              <Avatar className="h-10 w-10">
                <AvatarImage src={entry.profiles.avatar_url || undefined} />
                <AvatarFallback>
                  {entry.profiles.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="font-semibold">{entry.profiles.username}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.created_at).toLocaleDateString("vi-VN")}
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-primary">{entry.score}</p>
                <p className="text-xs text-muted-foreground">
                  {gameType === "spin_wheel" ? "BTC" : "điểm"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default GameLeaderboard;
