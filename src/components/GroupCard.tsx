import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Users, Settings, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AddMemberDialog from "./AddMemberDialog";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description: string | null;
    cover_url: string | null;
    created_by: string;
    member_count?: number;
    user_role?: string;
  };
  currentUserId: string;
  onManage?: (groupId: string) => void;
}

const GroupCard = ({ group, currentUserId, onManage }: GroupCardProps) => {
  const navigate = useNavigate();
  const [showAddMember, setShowAddMember] = useState(false);
  const isAdmin = group.user_role === "admin" || group.created_by === currentUserId;

  const handleCardClick = () => {
    navigate(`/groups/${group.id}`);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div
          className="h-32 bg-gradient-to-br from-primary/20 to-accent/20 relative cursor-pointer"
          onClick={handleCardClick}
        >
          {group.cover_url && (
            <img
              src={group.cover_url}
              alt={group.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3
              className="font-semibold text-lg cursor-pointer hover:text-primary"
              onClick={handleCardClick}
            >
              {group.name}
            </h3>
            <div className="flex gap-1">
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddMember(true);
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              )}
              {isAdmin && onManage && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onManage(group.id);
                  }}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {group.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {group.description}
            </p>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{group.member_count || 0} thành viên</span>
          </div>
        </CardContent>
      </Card>

      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        groupId={group.id}
        currentUserId={currentUserId}
      />
    </>
  );
};

export default GroupCard;
