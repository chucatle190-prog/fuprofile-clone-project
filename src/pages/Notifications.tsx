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
import { Bell, Check } from "lucide-react";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

interface Notification {
  id: string;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const Notifications = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useRealtimeNotifications(user?.id);

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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar user={user} />
      <div className="flex">
        <LeftSidebar />
        <main className="flex-1 container max-w-2xl mx-auto px-4 py-6 mb-16 md:mb-0">
          <Card className="shadow-medium">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Thông báo {unreadCount > 0 && `(${unreadCount} chưa đọc)`}
              </CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Đánh dấu tất cả đã đọc
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Không có thông báo nào
                </p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.is_read && markAsRead(notif.id)}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        notif.is_read 
                          ? "bg-secondary/30 hover:bg-secondary/40" 
                          : "bg-primary/10 hover:bg-primary/20 border-l-4 border-primary"
                      }`}
                    >
                      <p className={`text-sm ${!notif.is_read ? 'font-semibold' : ''}`}>
                        {notif.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.created_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <RightSidebar />
      </div>
      <MobileNav user={user} />
    </div>
  );
};

export default Notifications;