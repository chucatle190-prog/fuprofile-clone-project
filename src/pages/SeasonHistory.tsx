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
import { Trophy, Medal, Award, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChampionEntry {
  id: string;
  user_id: string;
  rank: number;
  category: string;
  season_number: number;
  awarded_at: string;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface SeasonGroup {
  season: number;
  holders: ChampionEntry[];
  receivers: ChampionEntry[];
  senders: ChampionEntry[];
}

const SeasonHistory = () => {
  const [user, setUser] = useState<User | null>(null);
  const [seasons, setSeasons] = useState<SeasonGroup[]>([]);
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
      fetchSeasonHistory();
    }
  }, [user]);

  const fetchSeasonHistory = async () => {
    try {
      const { data: championsData, error } = await supabase
        .from("season_champions")
        .select("*")
        .order("season_number", { ascending: false })
        .order("category", { ascending: true })
        .order("rank", { ascending: true });

      if (error) throw error;

      if (championsData) {
        // Enrich with profile data
        const enrichedChampions: ChampionEntry[] = [];
        for (const champion of championsData) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, full_name, avatar_url")
            .eq("id", champion.user_id)
            .single();

          if (profile) {
            enrichedChampions.push({
              ...champion,
              profiles: profile,
            });
          }
        }

        // Group by season
        const seasonMap = new Map<number, SeasonGroup>();
        enrichedChampions.forEach((champion) => {
          if (!seasonMap.has(champion.season_number)) {
            seasonMap.set(champion.season_number, {
              season: champion.season_number,
              holders: [],
              receivers: [],
              senders: [],
            });
          }
          
          const seasonGroup = seasonMap.get(champion.season_number)!;
          if (champion.category === "holder") {
            seasonGroup.holders.push(champion);
          } else if (champion.category === "receiver") {
            seasonGroup.receivers.push(champion);
          } else if (champion.category === "sender") {
            seasonGroup.senders.push(champion);
          }
        });

        setSeasons(Array.from(seasonMap.values()));
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải lịch sử danh hiệu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getRankTitle = (rank: number) => {
    switch (rank) {
      case 1:
        return "👑 Quán quân";
      case 2:
        return "🥈 Á vua";
      case 3:
        return "🥉 Á quân";
      default:
        return "";
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case "holder":
        return "Giữ CAMLY";
      case "receiver":
        return "Nhận CAMLY";
      case "sender":
        return "Chuyển CAMLY";
      default:
        return category;
    }
  };

  const renderChampionCard = (champion: ChampionEntry) => (
    <div
      key={champion.id}
      className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
    >
      <div className="flex items-center justify-center">
        {getRankIcon(champion.rank)}
      </div>

      <Avatar className="h-10 w-10">
        <AvatarImage src={champion.profiles.avatar_url || undefined} />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {champion.profiles.username[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-sm text-foreground truncate">
            {champion.profiles.full_name || champion.profiles.username}
          </p>
          <Badge className="text-xs">{getRankTitle(champion.rank)}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">@{champion.profiles.username}</p>
      </div>
    </div>
  );

  const renderSeasonCategory = (title: string, champions: ChampionEntry[]) => {
    if (champions.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
          <span className="text-primary">⚡</span> {title}
        </h4>
        <div className="space-y-2">
          {champions.map(renderChampionCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          <div className="hidden lg:block">
            <LeftSidebar />
          </div>

          <main className="flex-1 max-w-4xl mx-auto">
            <Card className="mb-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Trophy className="w-16 h-16 text-yellow-500" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  🏆 Lịch Sử Danh Hiệu Mùa Giải
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  Xem tất cả Quán quân, Á vua và Á quân qua các mùa giải
                </p>
              </CardHeader>
            </Card>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
            ) : seasons.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Chưa có danh hiệu nào được ghi nhận</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {seasons.map((seasonGroup) => (
                  <Card key={seasonGroup.season} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 border-b">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Mùa Giải {seasonGroup.season}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      {renderSeasonCategory("Giữ CAMLY Nhiều Nhất", seasonGroup.holders)}
                      {renderSeasonCategory("Nhận CAMLY Nhiều Nhất", seasonGroup.receivers)}
                      {renderSeasonCategory("Chuyển CAMLY Nhiều Nhất", seasonGroup.senders)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>

          <div className="hidden lg:block">
            <RightSidebar />
          </div>
        </div>
      </div>

      <MobileNav />
    </div>
  );
};

export default SeasonHistory;
