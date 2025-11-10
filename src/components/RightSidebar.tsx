import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { UserPlus, Search, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  member_count?: number;
}

const RightSidebar = () => {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<"friends" | "community">("community");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    fetchSuggestions();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchGroupSuggestions();
    }
  }, [groupFilter, currentUserId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchSuggestions = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .limit(5);
    
    if (data) setSuggestions(data);
  };

  const fetchGroupSuggestions = async () => {
    if (!currentUserId) return;

    try {
      if (groupFilter === "friends") {
        // Lấy nhóm mà bạn bè đã tham gia
        const { data: friendships } = await supabase
          .from("friendships")
          .select("friend_id, user_id")
          .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
          .eq("status", "accepted");

        if (!friendships || friendships.length === 0) {
          setGroups([]);
          return;
        }

        const friendIds = friendships.map(f => 
          f.user_id === currentUserId ? f.friend_id : f.user_id
        );

        // Lấy group_members của bạn bè
        const { data: friendGroupMemberships } = await supabase
          .from("group_members")
          .select("group_id")
          .in("user_id", friendIds);

        if (!friendGroupMemberships || friendGroupMemberships.length === 0) {
          setGroups([]);
          return;
        }

        const groupIds = [...new Set(friendGroupMemberships.map(m => m.group_id))];

        // Lấy các nhóm mà user chưa tham gia
        const { data: userGroups } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", currentUserId);

        const userGroupIds = (userGroups || []).map(g => g.group_id);
        const suggestedGroupIds = groupIds.filter(id => !userGroupIds.includes(id));

        if (suggestedGroupIds.length === 0) {
          setGroups([]);
          return;
        }

        const { data: groupsData } = await supabase
          .from("groups")
          .select("*")
          .in("id", suggestedGroupIds)
          .limit(5);

        if (groupsData) {
          const enrichedGroups = await Promise.all(
            groupsData.map(async (group) => {
              const { count } = await supabase
                .from("group_members")
                .select("*", { count: "exact", head: true })
                .eq("group_id", group.id);
              return { ...group, member_count: count || 0 };
            })
          );
          setGroups(enrichedGroups);
        }
      } else {
        // Lấy tất cả nhóm mà user chưa tham gia
        const { data: userGroups } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", currentUserId);

        const userGroupIds = (userGroups || []).map(g => g.group_id);

        let query = supabase
          .from("groups")
          .select("*")
          .not("id", "in", `(${userGroupIds.join(",")})`);

        if (searchQuery) {
          query = query.ilike("name", `%${searchQuery}%`);
        }

        const { data: groupsData } = await query.limit(5);

        if (groupsData) {
          const enrichedGroups = await Promise.all(
            groupsData.map(async (group) => {
              const { count } = await supabase
                .from("group_members")
                .select("*", { count: "exact", head: true })
                .eq("group_id", group.id);
              return { ...group, member_count: count || 0 };
            })
          );
          setGroups(enrichedGroups);
        }
      }
    } catch (error) {
      console.error("Error fetching group suggestions:", error);
    }
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

  const handleJoinGroup = async (groupId: string) => {
    if (!currentUserId) return;

    await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: currentUserId,
      role: "member"
    });

    fetchGroupSuggestions();
  };

  return (
    <aside className="hidden lg:block w-80 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto p-4">
      <div className="bg-card rounded-lg p-4 shadow-soft">
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="friends">Kết bạn</TabsTrigger>
            <TabsTrigger value="groups">Nhóm</TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="mt-0">
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
          </TabsContent>

          <TabsContent value="groups" className="mt-0">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={groupFilter === "friends" ? "default" : "outline"}
                  onClick={() => setGroupFilter("friends")}
                  className="flex-1"
                >
                  Bạn bè
                </Button>
                <Button
                  size="sm"
                  variant={groupFilter === "community" ? "default" : "outline"}
                  onClick={() => setGroupFilter("community")}
                  className="flex-1"
                >
                  Cộng đồng
                </Button>
              </div>

              {groupFilter === "community" && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm nhóm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        fetchGroupSuggestions();
                      }
                    }}
                    className="pl-10"
                  />
                </div>
              )}

              <div className="space-y-3">
                {groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {groupFilter === "friends" 
                      ? "Bạn bè chưa tham gia nhóm nào" 
                      : "Không tìm thấy nhóm"}
                  </p>
                ) : (
                  groups.map((group) => (
                    <div key={group.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-foreground line-clamp-1">
                            {group.name}
                          </h4>
                          {group.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {group.description}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-2">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {group.member_count || 0} thành viên
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/groups/${group.id}`)}
                          className="flex-1"
                        >
                          Xem
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleJoinGroup(group.id)}
                          className="flex-1"
                        >
                          Tham gia
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
};

export default RightSidebar;