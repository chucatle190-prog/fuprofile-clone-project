import { Home, Users, UserPlus, Settings, Wallet, ShoppingBag, Trophy, Calendar } from "lucide-react";
import { NavLink } from "./NavLink";

const LeftSidebar = () => {
  return (
    <aside className="hidden md:block w-64 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto p-4">
      <nav className="space-y-2">
        <NavLink
          to="/feed"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-accent/50 transition-colors"
          activeClassName="bg-accent text-accent-foreground"
        >
          <Home className="h-5 w-5" />
          <span className="font-medium">Trang chủ</span>
        </NavLink>
        
        <NavLink
          to="/friends"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-accent/50 transition-colors"
          activeClassName="bg-accent text-accent-foreground"
        >
          <UserPlus className="h-5 w-5" />
          <span className="font-medium">Bạn bè</span>
        </NavLink>
        
        <NavLink
          to="/groups"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-accent/50 transition-colors"
          activeClassName="bg-accent text-accent-foreground"
        >
          <Users className="h-5 w-5" />
          <span className="font-medium">Nhóm</span>
        </NavLink>
        
        <NavLink
          to="/marketplace"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-accent/50 transition-colors"
          activeClassName="bg-accent text-accent-foreground"
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="font-medium">Marketplace</span>
        </NavLink>
        
        <NavLink
          to="/wallet"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-accent/50 transition-colors"
          activeClassName="bg-accent text-accent-foreground"
        >
          <Wallet className="h-5 w-5" />
          <span className="font-medium">Ví</span>
        </NavLink>
        
        <NavLink
          to="/leaderboard"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-accent/50 transition-colors"
          activeClassName="bg-accent text-accent-foreground"
        >
          <Trophy className="h-5 w-5" />
          <span className="font-medium">Xếp Hạng</span>
        </NavLink>
        
        <NavLink
          to="/season-history"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-accent/50 transition-colors"
          activeClassName="bg-accent text-accent-foreground"
        >
          <Calendar className="h-5 w-5" />
          <span className="font-medium">Lịch Sử Mùa Giải</span>
        </NavLink>
        
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-accent/50 transition-colors"
          activeClassName="bg-accent text-accent-foreground"
        >
          <Settings className="h-5 w-5" />
          <span className="font-medium">Cài đặt</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default LeftSidebar;