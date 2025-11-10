import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, UserPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  currentUserId: string;
}

interface Friend {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  isMember: boolean;
}

const AddMemberDialog = ({ open, onOpenChange, groupId, currentUserId }: AddMemberDialogProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'member' | 'moderator' | 'admin'>('member');

  useEffect(() => {
    if (open) {
      fetchFriends();
    }
  }, [open, groupId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredFriends(
        friends.filter(
          (f) =>
            f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredFriends(friends);
    }
  }, [searchQuery, friends]);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      // Lấy danh sách bạn bè
      const { data: friendships } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
        .eq("status", "accepted");

      const friendIds = Array.from(
        new Set(
          (friendships || []).map((f) =>
            f.user_id === currentUserId ? f.friend_id : f.user_id
          )
        )
      );

      if (friendIds.length === 0) {
        setFriends([]);
        setFilteredFriends([]);
        setLoading(false);
        return;
      }

      // Lấy thông tin profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", friendIds);

      // Lấy danh sách members của group
      const { data: members } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);

      const memberIds = new Set((members || []).map((m) => m.user_id));

      const friendsList = (profiles || []).map((p) => ({
        ...p,
        isMember: memberIds.has(p.id),
      }));

      setFriends(friendsList);
      setFilteredFriends(friendsList);
    } catch (error) {
      console.error("Error fetching friends:", error);
      toast.error("Không thể tải danh sách bạn bè");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (friendId: string) => {
    setAdding(friendId);
    try {
      const { error } = await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: friendId,
        role: selectedRole,
      });

      if (error) throw error;

      toast.success(`Đã thêm thành viên với vai trò ${getRoleName(selectedRole)}`);
      
      // Update local state
      setFriends((prev) =>
        prev.map((f) => (f.id === friendId ? { ...f, isMember: true } : f))
      );
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Không thể thêm thành viên");
    } finally {
      setAdding(null);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Quản trị viên';
      case 'moderator': return 'Điều hành viên';
      default: return 'Thành viên';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm thành viên</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bạn bè..."
              className="pl-10"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Vai trò</label>
            <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Thành viên</SelectItem>
                <SelectItem value="moderator">Điều hành viên</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Đang tải...</p>
            ) : filteredFriends.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? "Không tìm thấy bạn bè" : "Bạn chưa có bạn bè nào"}
              </p>
            ) : (
              filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.avatar_url || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {friend.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {friend.full_name || friend.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{friend.username}
                      </p>
                    </div>
                  </div>

                  {friend.isMember ? (
                    <span className="text-sm text-muted-foreground">Đã tham gia</span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleAddMember(friend.id)}
                      disabled={adding === friend.id}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {adding === friend.id ? "Đang thêm..." : "Thêm"}
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberDialog;
