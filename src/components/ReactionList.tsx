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

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`story_reactions:${storyId}:${reactionType}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'story_reactions',
          filter: `story_id=eq.${storyId}`,
        },
        (payload) => {
          console.log('Reaction change:', payload);
          fetchReactedUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storyId, reactionType]);

  const fetchReactedUsers = async () => {
    // Lấy danh sách user_id đã react
    const { data: reacts, error } = await supabase
      .from("story_reactions")
      .select("user_id")
      .eq("story_id", storyId)
      .eq("reaction_type", reactionType);

    if (error) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const userIds = Array.from(new Set((reacts || []).map((r: any) => r.user_id)));
    if (userIds.length === 0) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    const result = userIds
      .map((id) => profileMap.get(id))
      .filter(Boolean)
      .map((p: any) => ({ user_id: p.id, profiles: p })) as ReactedUser[];

    setUsers(result);
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
