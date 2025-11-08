import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { UserPlus } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

const RightSidebar = () => {
  const [suggestions, setSuggestions] = useState<Profile[]>([]);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .limit(5);
    
    if (data) setSuggestions(data);
  };

  const handleAddFriend = async (friendId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("friendships").insert({
      user_id: user.id,
      friend_id: friendId,
      status: "pending"
    });
  };

  return (
    <aside className="hidden lg:block w-80 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto p-4">
      <div className="bg-card rounded-lg p-4 shadow-soft">
        <h3 className="font-semibold text-foreground mb-4">Gợi ý kết bạn</h3>
        <div className="space-y-3">
          {suggestions.map((profile) => (
            <div key={profile.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm text-foreground">{profile.full_name || profile.username}</p>
                  <p className="text-xs text-muted-foreground">@{profile.username}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAddFriend(profile.id)}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;