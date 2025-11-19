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
import { Users, Plus } from "lucide-react";
import CreateGroupDialog from "@/components/CreateGroupDialog";
import GroupCard from "@/components/GroupCard";

interface Group {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_by: string;
  member_count?: number;
  user_role?: string;
}

const Groups = () => {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const navigate = useNavigate();

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
      fetchGroups();
    }
  }, [user]);

  // Realtime subscriptions for groups
  useEffect(() => {
    if (!user) return;

    const groupsChannel = supabase
      .channel(`groups-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups'
        },
        (payload) => {
          console.log('Group change detected:', payload);
          fetchGroups();
        }
      )
      .subscribe((status) => {
        console.log('Groups channel status:', status);
      });

    const membersChannel = supabase
      .channel(`group-members-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Group member change detected:', payload);
          fetchGroups();
        }
      )
      .subscribe((status) => {
        console.log('Group members channel status:', status);
      });

    return () => {
      supabase.removeChannel(groupsChannel);
      supabase.removeChannel(membersChannel);
    };
  }, [user]);

  const fetchGroups = async () => {
    if (!user) return;

    try {
      // Lấy danh sách group_members của user
      const { data: memberships, error: memberError } = await supabase
        .from("group_members")
        .select("group_id, role")
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      const groupIds = (memberships || []).map((m) => m.group_id);

      if (groupIds.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      // Lấy thông tin groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("*")
        .in("id", groupIds);

      if (groupsError) throw groupsError;

      // Đếm số thành viên cho mỗi group
      const enrichedGroups = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { count } = await supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id);

          const membership = memberships?.find((m) => m.group_id === group.id);

          return {
            ...group,
            member_count: count || 0,
            user_role: membership?.role,
          };
        })
      );

      setGroups(enrichedGroups);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar user={user} />
      <div className="flex">
        <LeftSidebar />
        <main className="flex-1 container max-w-6xl mx-auto px-4 py-6 mb-16 md:mb-0">
          <Card className="shadow-medium mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Nhóm của bạn
                </CardTitle>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo nhóm
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Đang tải...</p>
              ) : groups.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Bạn chưa tham gia nhóm nào
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo nhóm đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      currentUserId={user?.id || ""}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <RightSidebar />
      </div>
      <MobileNav user={user} />
      
      {user && (
        <CreateGroupDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          userId={user.id}
          onGroupCreated={fetchGroups}
        />
      )}
    </div>
  );
};

export default Groups;