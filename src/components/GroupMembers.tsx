import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Users, UserMinus, Crown } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface GroupMembersProps {
  groupId: string;
  currentUserId: string;
  userRole?: string;
}

const GroupMembers = ({ groupId, currentUserId, userRole }: GroupMembersProps) => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
    setupRealtimeSubscription();
  }, [groupId]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`group_members_${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_members",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchMembers = async () => {
    try {
      const { data: membersData, error } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId)
        .order("joined_at", { ascending: true });

      if (error) throw error;

      if (membersData && membersData.length > 0) {
        // Fetch profiles separately
        const userIds = membersData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", userIds);

        // Map profiles to members
        const profileMap = new Map((profilesData || []).map(p => [p.id, p]));
        const enriched = membersData.map(m => ({
          ...m,
          profiles: profileMap.get(m.user_id) || {
            id: m.user_id,
            username: "Unknown",
            full_name: null,
            avatar_url: null,
          },
        }));

        setMembers(enriched);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Không thể tải danh sách thành viên");
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string, memberUserId: string) => {
    if (memberUserId === currentUserId) {
      toast.error("Bạn không thể tự xóa mình khỏi nhóm");
      return;
    }

    if (!confirm("Bạn có chắc chắn muốn xóa thành viên này?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      // Tạo thông báo cho thành viên bị xóa
      await supabase.from("notifications").insert({
        user_id: memberUserId,
        type: "group_removed",
        content: `Bạn đã bị xóa khỏi nhóm`,
        related_id: groupId,
      });

      toast.success("Đã xóa thành viên");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Không thể xóa thành viên");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Đang tải...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Thành viên ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => {
            const isCurrentUser = member.user_id === currentUserId;
            const canRemove = userRole === "admin" && !isCurrentUser;

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Avatar
                    className="h-10 w-10 cursor-pointer"
                    onClick={() => navigate(`/profile/${member.profiles.username}`)}
                  >
                    <AvatarImage src={member.profiles.avatar_url || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {member.profiles.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className="font-medium text-sm cursor-pointer hover:underline"
                        onClick={() => navigate(`/profile/${member.profiles.username}`)}
                      >
                        {member.profiles.full_name || member.profiles.username}
                      </p>
                      {member.role === "admin" && (
                        <Badge variant="default" className="text-xs flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          Admin
                        </Badge>
                      )}
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">
                          Bạn
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      @{member.profiles.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tham gia: {new Date(member.joined_at).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
                {canRemove && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeMember(member.id, member.user_id)}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupMembers;
