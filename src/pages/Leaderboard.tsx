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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTopRankings } from "@/hooks/useTopRankings";
import happyCamlyCoin from "@/assets/happy-camly-coin.jpg";

interface LeaderboardEntry {
  user_id: string;
  amount: number;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

const Leaderboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [holdersLeaderboard, setHoldersLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [receiversLeaderboard, setReceiversLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [sendersLeaderboard, setSendersLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setTopHolder, setTopReceiver, setTopSender } = useTopRankings();

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
      fetchLeaderboards();
    }
  }, [user]);

  const fetchLeaderboards = async () => {
    try {
      // Fetch holders (people with most tokens)
      const { data: holdersData, error: holdersError } = await supabase
        .from("user_wallets")
        .select("user_id, camly_balance")
        .order("camly_balance", { ascending: false })
        .limit(50);

      if (holdersError) throw holdersError;

      // Fetch receivers (people who received most tokens)
      const { data: receiversData, error: receiversError } = await supabase
        .from("token_transfers")
        .select("receiver_id")
        .eq("status", "completed");

      if (receiversError) throw receiversError;

      // Fetch senders (people who sent most tokens)
      const { data: sendersData, error: sendersError } = await supabase
        .from("token_transfers")
        .select("sender_id, amount")
        .eq("status", "completed");

      if (sendersError) throw sendersError;

      // Process holders
      if (holdersData) {
        const enrichedHolders: LeaderboardEntry[] = [];
        for (const wallet of holdersData) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, full_name, avatar_url")
            .eq("id", wallet.user_id)
            .single();

          if (profile) {
            enrichedHolders.push({
              user_id: wallet.user_id,
              amount: wallet.camly_balance,
              profiles: profile,
            });
          }
        }
        setHoldersLeaderboard(enrichedHolders);
        
        // Set top holder
        if (enrichedHolders.length > 0) {
          setTopHolder(enrichedHolders[0].user_id);
        }
      }

      // Process receivers
      if (receiversData) {
        const receiverCounts = receiversData.reduce((acc, transfer) => {
          acc[transfer.receiver_id] = (acc[transfer.receiver_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const sortedReceivers = Object.entries(receiverCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 50);

        const enrichedReceivers: LeaderboardEntry[] = [];
        for (const [userId, count] of sortedReceivers) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, full_name, avatar_url")
            .eq("id", userId)
            .single();

          if (profile) {
            enrichedReceivers.push({
              user_id: userId,
              amount: count,
              profiles: profile,
            });
          }
        }
        setReceiversLeaderboard(enrichedReceivers);
        
        // Set top receiver
        if (enrichedReceivers.length > 0) {
          setTopReceiver(enrichedReceivers[0].user_id);
        }
      }

      // Process senders
      if (sendersData) {
        const senderTotals = sendersData.reduce((acc, transfer) => {
          acc[transfer.sender_id] = (acc[transfer.sender_id] || 0) + Number(transfer.amount);
          return acc;
        }, {} as Record<string, number>);

        const sortedSenders = Object.entries(senderTotals)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 50);

        const enrichedSenders: LeaderboardEntry[] = [];
        for (const [userId, total] of sortedSenders) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, full_name, avatar_url")
            .eq("id", userId)
            .single();

          if (profile) {
            enrichedSenders.push({
              user_id: userId,
              amount: total,
              profiles: profile,
            });
          }
        }
        setSendersLeaderboard(enrichedSenders);
        
        // Set top sender
        if (enrichedSenders.length > 0) {
          setTopSender(enrichedSenders[0].user_id);
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
        return <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600">👑 Vua Camly</Badge>;
      case 2:
        return <Badge className="bg-gradient-to-r from-gray-300 to-gray-500">🥈 Á Vua</Badge>;
      case 3:
        return <Badge className="bg-gradient-to-r from-orange-400 to-orange-600">🥉 Á Quân</Badge>;
      default:
        return null;
    }
  };

  const renderLeaderboardList = (data: LeaderboardEntry[], label: string) => {
    if (loading) {
      return <div className="text-center py-8 text-muted-foreground">Đang tải...</div>;
    }

    if (data.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">Chưa có dữ liệu</div>;
    }

    return (
      <div className="space-y-2">
        {data.map((entry, index) => (
          <div
            key={entry.user_id}
            className={`flex items-center gap-4 p-4 rounded-lg transition-all hover:scale-[1.02] ${
              index < 3
                ? "bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30"
                : "bg-card"
            } ${entry.user_id === user?.id ? "ring-2 ring-primary" : ""}`}
          >
            <div className="flex items-center justify-center w-16">
              {getRankIcon(index + 1)}
            </div>

            <Avatar className="h-12 w-12">
              <AvatarImage src={entry.profiles.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {entry.profiles.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-foreground truncate">
                  {entry.profiles.full_name || entry.profiles.username}
                </p>
                {getRankBadge(index + 1)}
                {entry.user_id === user?.id && (
                  <Badge variant="outline" className="ml-auto">Bạn</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{entry.profiles.username}</p>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {entry.amount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
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
            <Card className="mb-6 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <img 
                    src={happyCamlyCoin} 
                    alt="Happy Camly Coin" 
                    className="w-32 h-32 object-contain rounded-full"
                  />
                </div>
                <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  🏆 Bảng Xếp Hạng Happy Camly
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  Top người dùng xuất sắc nhất trong cộng đồng Happy Camly
                </p>
              </CardHeader>
            </Card>

            <Tabs defaultValue="holders" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="holders" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Giữ Nhiều Nhất
                </TabsTrigger>
                <TabsTrigger value="receivers" className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Nhận Nhiều Nhất
                </TabsTrigger>
                <TabsTrigger value="senders" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Chuyển Nhiều Nhất
                </TabsTrigger>
              </TabsList>

              <TabsContent value="holders">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      Top Người Giữ Token
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Những người sở hữu nhiều Happy Camly Coin nhất
                    </p>
                  </CardHeader>
                  <CardContent>
                    {renderLeaderboardList(holdersLeaderboard, "Camly")}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="receivers">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-primary" />
                      Top Người Nhận Token
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Những người nhận nhiều giao dịch Camly nhất
                    </p>
                  </CardHeader>
                  <CardContent>
                    {renderLeaderboardList(receiversLeaderboard, "giao dịch")}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="senders">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Top Người Chuyển Token
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Những người đã chuyển nhiều Camly nhất cho người khác
                    </p>
                  </CardHeader>
                  <CardContent>
                    {renderLeaderboardList(sendersLeaderboard, "Camly")}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="mt-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  Phần Thưởng Đặc Biệt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="font-bold text-lg">Top 1 - Vua Camly</p>
                      <p className="text-sm text-muted-foreground">Nhận 1000 Camly thưởng + Badge đặc biệt</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Medal className="h-7 w-7 text-gray-400" />
                    <div>
                      <p className="font-bold">Top 2 - Á Vua</p>
                      <p className="text-sm text-muted-foreground">Nhận 500 Camly thưởng</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="h-6 w-6 text-orange-600" />
                    <div>
                      <p className="font-bold">Top 3 - Á Quân</p>
                      <p className="text-sm text-muted-foreground">Nhận 250 Camly thưởng</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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

export default Leaderboard;