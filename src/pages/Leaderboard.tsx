import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardEntry {
  user_id: string;
  camly_balance: number;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

const Leaderboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchLeaderboard();
    }
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      const { data: walletsData, error } = await supabase
        .from("user_wallets")
        .select("user_id, camly_balance")
        .order("camly_balance", { ascending: false })
        .limit(100);

      if (error) throw error;

      if (walletsData) {
        const enrichedData: LeaderboardEntry[] = [];
        
        for (const wallet of walletsData) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, full_name, avatar_url")
            .eq("id", wallet.user_id)
            .single();

          if (profile) {
            enrichedData.push({
              ...wallet,
              profiles: profile,
            });
          }
        }

        setLeaderboard(enrichedData);

        // Find user's rank
        const userIndex = enrichedData.findIndex(entry => entry.user_id === user?.id);
        if (userIndex !== -1) {
          setUserRank(userIndex + 1);
        }
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải bảng xếp hạng",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-8 w-8 text-yellow-500" />;
      case 2:
        return <Medal className="h-7 w-7 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-600" />;
      default:
        return <span className="text-2xl font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600">👑 Vua F.U</Badge>;
      case 2:
        return <Badge className="bg-gradient-to-r from-gray-300 to-gray-500">🥈 Á Vua</Badge>;
      case 3:
        return <Badge className="bg-gradient-to-r from-orange-400 to-orange-600">🥉 Hạng Ba</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar user={user} />
      <div className="flex">
        <LeftSidebar />
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-6 mb-16 md:mb-0">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Bảng Xếp Hạng F.U Token
              </CardTitle>
              {userRank && (
                <p className="text-sm text-muted-foreground">
                  Hạng của bạn: <span className="font-bold text-foreground">#{userRank}</span>
                </p>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Đang tải...</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Chưa có dữ liệu xếp hạng</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => {
                    const rank = index + 1;
                    const isCurrentUser = entry.user_id === user?.id;
                    
                    return (
                      <div
                        key={entry.user_id}
                        className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                          isCurrentUser
                            ? "bg-primary/10 border-2 border-primary"
                            : rank <= 3
                            ? "bg-gradient-to-r from-yellow-50/50 to-transparent dark:from-yellow-900/20"
                            : "bg-secondary/30 hover:bg-secondary/50"
                        }`}
                      >
                        {/* Rank */}
                        <div className="flex-shrink-0 w-16 flex justify-center">
                          {getRankIcon(rank)}
                        </div>

                        {/* Avatar */}
                        <Avatar className={`${rank <= 3 ? "h-14 w-14 ring-2 ring-yellow-500" : "h-12 w-12"}`}>
                          <AvatarImage src={entry.profiles.avatar_url || undefined} />
                          <AvatarFallback>
                            {entry.profiles.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold truncate ${rank <= 3 ? "text-lg" : ""}`}>
                              {entry.profiles.full_name || entry.profiles.username}
                            </p>
                            {getRankBadge(rank)}
                            {isCurrentUser && (
                              <Badge variant="outline" className="bg-primary/20">Bạn</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">@{entry.profiles.username}</p>
                        </div>

                        {/* Balance */}
                        <div className="flex-shrink-0 text-right">
                          <div className="flex items-center gap-2 text-accent font-bold text-xl">
                            <Coins className="h-5 w-5" />
                            {Number(entry.camly_balance).toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground">F.U Token</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rewards Info */}
          <Card className="mt-6 shadow-medium">
            <CardHeader>
              <CardTitle className="text-lg">🎁 Phần Thưởng Đặc Biệt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-900/20 rounded-lg">
                <Trophy className="h-8 w-8 text-yellow-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Top 1: Vua F.U Token</p>
                  <p className="text-sm text-muted-foreground">Nhận badge đặc biệt và 1000 F.U Token thưởng</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                <Medal className="h-7 w-7 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Top 2-3</p>
                  <p className="text-sm text-muted-foreground">Nhận 500 F.U Token thưởng</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                <Award className="h-6 w-6 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Top 4-10</p>
                  <p className="text-sm text-muted-foreground">Nhận 200 F.U Token thưởng</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
        <RightSidebar />
      </div>
      <MobileNav />
    </div>
  );
};

export default Leaderboard;