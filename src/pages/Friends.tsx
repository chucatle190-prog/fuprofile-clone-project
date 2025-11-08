import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, UserCheck, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  profiles: {
    id: string;
    username: string;
    full_name: string | null;
  };
}

const Friends = () => {
  const [user, setUser] = useState<User | null>(null);
  const [friendRequests, setFriendRequests] = useState<Friendship[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
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
    const { data: requests } = await supabase
      .from("friendships")
      .select(`
        *,
        profiles!friendships_user_id_fkey (id, username, full_name)
      `)
      .eq("friend_id", userId)
      .eq("status", "pending");

    const { data: accepted } = await supabase
      .from("friendships")
      .select(`
        *,
        profiles!friendships_friend_id_fkey (id, username, full_name)
      `)
      .eq("user_id", userId)
      .eq("status", "accepted");

    if (requests) setFriendRequests(requests as any);
    if (accepted) setFriends(accepted as any);
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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar user={user} />
      <div className="flex">
        <LeftSidebar />
        <main className="flex-1 container max-w-2xl mx-auto px-4 py-6 mb-16 md:mb-0 space-y-6">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Lời mời kết bạn
              </CardTitle>
            </CardHeader>
            <CardContent>
              {friendRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Không có lời mời kết bạn nào
                </p>
              ) : (
                <div className="space-y-3">
                  {friendRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {request.profiles.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.profiles.full_name || request.profiles.username}</p>
                          <p className="text-sm text-muted-foreground">@{request.profiles.username}</p>
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Bạn bè ({friends.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {friends.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Chưa có bạn bè nào
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
                    >
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {friend.profiles.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{friend.profiles.full_name || friend.profiles.username}</p>
                        <p className="text-sm text-muted-foreground">@{friend.profiles.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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