import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface ReactionListProps {
  storyId: string;
  reactionType: string;
}

interface ReactedUser {
  user_id: string;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

const ReactionList = ({ storyId, reactionType }: ReactionListProps) => {
  const [users, setUsers] = useState<ReactedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReactedUsers();
  }, [storyId, reactionType]);

  const fetchReactedUsers = async () => {
    const { data, error } = await supabase
      .from("story_reactions")
      .select(`
        user_id,
        profiles:user_id (username, full_name, avatar_url)
      `)
      .eq("story_id", storyId)
      .eq("reaction_type", reactionType);

    if (!error && data) {
      setUsers(data as any);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Đang tải...</div>;
  }

  if (users.length === 0) {
    return <div className="text-sm text-muted-foreground">Chưa có ai react</div>;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground mb-2">
        Người đã react {reactionType}
      </p>
      {users.map((user) => (
        <div key={user.user_id} className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profiles.avatar_url || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user.profiles.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {user.profiles.full_name || user.profiles.username}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ReactionList;
