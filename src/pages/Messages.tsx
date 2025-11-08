import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import MobileNav from "@/components/MobileNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";

const Messages = () => {
  const [user, setUser] = useState<User | null>(null);
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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar user={user} />
      <div className="flex">
        <LeftSidebar />
        <main className="flex-1 container max-w-6xl mx-auto px-4 py-6 mb-16 md:mb-0">
          <Card className="shadow-medium h-[calc(100vh-140px)] flex">
            <div className="w-full md:w-80 border-r border-border overflow-y-auto">
              <div className="p-4">
                <h2 className="font-semibold text-lg mb-4">Chat</h2>
                <p className="text-center text-muted-foreground py-8">
                  Chức năng chat đang được phát triển
                </p>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col">
              <div className="flex-1 p-6 overflow-y-auto">
                <p className="text-center text-muted-foreground">
                  Chọn một cuộc trò chuyện để bắt đầu
                </p>
              </div>
              
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input placeholder="Nhập tin nhắn..." />
                  <Button size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </main>
      </div>
      <MobileNav />
    </div>
  );
};

export default Messages;