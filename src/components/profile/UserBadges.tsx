import { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Award, Lock } from "lucide-react";

interface UserBadgesProps {
  userId: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
}

interface UserBadge {
  badge_id: string;
  earned_at: string;
  badges: Badge;
}

const UserBadges = ({ userId }: UserBadgesProps) => {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, [userId]);

  const fetchBadges = async () => {
    try {
      // Fetch all badges
      const { data: allBadgesData } = await supabase
        .from("badges")
        .select("*")
        .order("requirement_value", { ascending: true });

      setAllBadges(allBadgesData || []);

      // Fetch user's earned badges
      const { data: userBadgesData } = await supabase
        .from("user_badges")
        .select(`
          badge_id,
          earned_at,
          badges:badge_id(*)
        `)
        .eq("user_id", userId);

      setUserBadges(userBadgesData || []);
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasBadge = (badgeId: string) => {
    return userBadges.some((ub) => ub.badge_id === badgeId);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Đang tải...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Huy hiệu ({userBadges.length}/{allBadges.length})</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {allBadges.map((badge) => {
            const earned = hasBadge(badge.id);
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  earned
                    ? "border-primary bg-primary/5"
                    : "border-muted bg-muted/30 opacity-60"
                }`}
              >
                <div className="text-4xl mb-2">
                  {earned ? badge.icon : <Lock className="h-10 w-10 mx-auto text-muted-foreground" />}
                </div>
                <p className="font-semibold text-sm">{badge.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {badge.description}
                </p>
                {earned && (
                  <p className="text-xs text-primary mt-2">✓ Đã đạt được</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default UserBadges;
