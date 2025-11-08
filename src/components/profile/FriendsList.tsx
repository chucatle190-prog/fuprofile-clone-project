import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface Friend {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface FriendsListProps {
  userId: string;
}

const FriendsList = ({ userId }: FriendsListProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, [userId]);

  const fetchFriends = async () => {
    const { data } = await supabase
      .from("friendships")
      .select("profiles!friendships_friend_id_fkey(id, username, full_name, avatar_url)")
      .eq("user_id", userId)
      .eq("status", "accepted")
      .limit(9);

    if (data) {
      setFriends(data.map(f => f.profiles).filter(Boolean) as Friend[]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Đang tải...</p>
      </Card>
    );
  }

  if (friends.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Chưa có bạn bè</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {friends.map((friend) => (
        <Card key={friend.id} className="p-4 text-center hover:bg-accent/10 transition-colors cursor-pointer">
          <Avatar className="h-20 w-20 mx-auto mb-2">
            <AvatarImage src={friend.avatar_url || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {friend.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="font-medium text-sm truncate">
            {friend.full_name || friend.username}
          </p>
        </Card>
      ))}
    </div>
  );
};

export default FriendsList;
