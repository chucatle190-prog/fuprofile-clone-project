import { Home, Users, ShoppingBag, MessageCircle, Music, User as UserIcon } from "lucide-react";
import { NavLink } from "./NavLink";
import { Badge } from "./ui/badge";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { User } from "@supabase/supabase-js";

interface MobileNavProps {
  user?: User | null;
}

const MobileNav = ({ user }: MobileNavProps) => {
  const { unreadCount } = useRealtimeNotifications(user?.id);
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-14">
        <NavLink
          to="/feed"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-primary transition-colors"
          activeClassName="text-primary"
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Trang chủ</span>
        </NavLink>
        
        <NavLink
          to="/groups"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-primary transition-colors"
          activeClassName="text-primary"
        >
          <Users className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Nhóm</span>
        </NavLink>
        
        <NavLink
          to="/marketplace"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-primary transition-colors"
          activeClassName="text-primary"
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Chợ</span>
        </NavLink>
        
        <NavLink
          to="/messages"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-primary transition-colors"
          activeClassName="text-primary"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Chat</span>
        </NavLink>
        
        <NavLink
          to="/music"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-primary transition-colors"
          activeClassName="text-primary"
        >
          <Music className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Nhạc</span>
        </NavLink>
        
        <NavLink
          to="/profile"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-primary transition-colors"
          activeClassName="text-primary"
        >
          <UserIcon className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Cá nhân</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default MobileNav;