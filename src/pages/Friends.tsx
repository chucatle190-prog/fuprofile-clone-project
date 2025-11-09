import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { UserPlus, UserCheck, X, Users, Search, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  profiles: Profile;
}

const Friends = () => {
  const [user, setUser] = useState<User | null>(null);
  const [friendRequests, setFriendRequests] = useState<Friendship[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchFriendships(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchFriendships(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchFriendships = async (userId: string) => {
    // Get friend requests (pending, sent TO me)
    const { data: requests } = await supabase
      .from("friendships")
      .select(`
        *,
        profiles!friendships_user_id_fkey (id, username, full_name, avatar_url, bio)
      `)
      .eq("friend_id", userId)
      .eq("status", "pending");

    // Get accepted friends (both directions)
    const { data: accepted1 } = await supabase
      .from("friendships")
      .select(`
        *,
        profiles!friendships_friend_id_fkey (id, username, full_name, avatar_url, bio)
      `)
      .eq("user_id", userId)
      .eq("status", "accepted");

    const { data: accepted2 } = await supabase
      .from("friendships")
      .select(`
        *,
        profiles!friendships_user_id_fkey (id, username, full_name, avatar_url, bio)
      `)
      .eq("friend_id", userId)
      .eq("status", "accepted");

    if (requests) setFriendRequests(requests as any);
    
    const allFriends = [
      ...(accepted1 || []).map((f: any) => ({ ...f, other_user: f.profiles })),
      ...(accepted2 || []).map((f: any) => ({ ...f, other_user: f.profiles })),
    ];
    setFriends(allFriends as any);

    await fetchSuggestions(userId);
  };

  const fetchSuggestions = async (userId: string) => {
    // Get current friends and pending requests
    const { data: existingConnections } = await supabase
      .from("friendships")
      .select("friend_id, user_id")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    const connectedIds = new Set([userId]);
    existingConnections?.forEach((conn) => {
      connectedIds.add(conn.user_id);
      connectedIds.add(conn.friend_id);
    });

    // Get users not connected
    const { data: allUsers } = await supabase
      .from("profiles")
      .select("*")
      .limit(10);

    const filteredSuggestions = allUsers?.filter(
      (profile) => !connectedIds.has(profile.id)
    ) || [];

    setSuggestions(filteredSuggestions.slice(0, 6));
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("friendships")
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: "pending",
      });

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể gửi lời mời kết bạn",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Thành công",
        description: "Đã gửi lời mời kết bạn",
      });
      fetchFriendships(user.id);
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);

    toast({
      title: "Thành công",
      description: "Đã chấp nhận lời mời kết bạn",
    });

    fetchFriendships(user!.id);
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);

    toast({
      title: "Đã từ chối",
      description: "Đã từ chối lời mời kết bạn",
    });

    fetchFriendships(user!.id);
  };

  const filteredFriends = friends.filter((friend) => {
    const profile = (friend as any).other_user || friend.profiles;
    return (
      profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleMessageFriend = async (friendId: string, friendProfile: any) => {
    if (!user) return;

    try {
      // Check if conversation exists
      const { data: existingConvs } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      let conversationId = null;

      if (existingConvs) {
        for (const conv of existingConvs) {
          const { data: participants } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conv.conversation_id);

          if (
            participants &&
            participants.length === 2 &&
            participants.some((p) => p.user_id === friendId)
          ) {
            conversationId = conv.conversation_id;
            break;
          }
        }
      }

      // Create new conversation if doesn't exist
      if (!conversationId) {
        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert({ type: "direct" })
          .select()
          .single();

        if (convError) throw convError;

        conversationId = newConv.id;

        const { error: participantsError } = await supabase
          .from("conversation_participants")
          .insert([
            { conversation_id: conversationId, user_id: user.id },
            { conversation_id: conversationId, user_id: friendId },
          ]);

        if (participantsError) throw participantsError;
      }

      navigate("/messages", { state: { 
        conversationId,
        otherUser: {
          username: friendProfile.username,
          full_name: friendProfile.full_name,
          avatar_url: friendProfile.avatar_url,
        }
      } });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
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
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Bạn bè
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="friends" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="friends">
                    Tất cả bạn bè
                    {friends.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-primary/20 rounded-full text-xs">
                        {friends.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="requests">
                    Lời mời
                    {friendRequests.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-destructive/20 rounded-full text-xs">
                        {friendRequests.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="suggestions">Gợi ý</TabsTrigger>
                </TabsList>

                <TabsContent value="friends" className="space-y-4 mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm bạn bè..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {filteredFriends.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {searchQuery ? "Không tìm thấy bạn bè nào" : "Chưa có bạn bè nào"}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredFriends.map((friend) => {
                        const profile = (friend as any).other_user || friend.profiles;
                        return (
                          <Card key={friend.id} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={profile.avatar_url || ""} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                                  {profile.username[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">
                                  {profile.full_name || profile.username}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  @{profile.username}
                                </p>
                                {profile.bio && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {profile.bio}
                                  </p>
                                )}
                                <Button
                                  size="sm"
                                  className="mt-2 w-full"
                                  onClick={() => handleMessageFriend(profile.id, profile)}
                                >
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                  Nhắn tin
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="requests" className="space-y-3 mt-4">
                  {friendRequests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Không có lời mời kết bạn nào
                    </p>
                  ) : (
                    friendRequests.map((request) => (
                      <Card key={request.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-14 w-14">
                              <AvatarImage src={request.profiles.avatar_url || ""} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {request.profiles.username[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">
                                {request.profiles.full_name || request.profiles.username}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                @{request.profiles.username}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => acceptFriendRequest(request.id)}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Chấp nhận
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectFriendRequest(request.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="suggestions" className="space-y-3 mt-4">
                  {suggestions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Không có gợi ý nào
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {suggestions.map((suggestion) => (
                        <Card key={suggestion.id} className="p-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-col items-center text-center gap-3">
                            <Avatar className="h-20 w-20">
                              <AvatarImage src={suggestion.avatar_url || ""} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                                {suggestion.username[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="w-full">
                              <p className="font-semibold truncate">
                                {suggestion.full_name || suggestion.username}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                @{suggestion.username}
                              </p>
                              {suggestion.bio && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {suggestion.bio}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => sendFriendRequest(suggestion.id)}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Thêm bạn bè
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
        <RightSidebar />
      </div>
      <MobileNav />
    </div>
  );
};

export default Friends;