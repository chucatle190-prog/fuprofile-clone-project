import { Home, PlusSquare, MessageCircle, Bell, User } from "lucide-react";
import { NavLink } from "./NavLink";

const MobileNav = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-14">
        <NavLink
          to="/feed"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-primary transition-colors"
          activeClassName="text-primary"
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-0.5">Trang chủ</span>
        </NavLink>
        
        <NavLink
          to="/create"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-primary transition-colors"
          activeClassName="text-primary"
        >
          <PlusSquare className="h-6 w-6" />
          <span className="text-xs mt-0.5">Tạo bài</span>
        </NavLink>
        
        <NavLink
          to="/messages"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-primary transition-colors"
          activeClassName="text-primary"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="text-xs mt-0.5">Chat</span>
        </NavLink>
        
        <NavLink
          to="/notifications"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-primary transition-colors"
          activeClassName="text-primary"
        >
          <Bell className="h-6 w-6" />
          <span className="text-xs mt-0.5">Thông báo</span>
        </NavLink>
        
        <NavLink
          to="/profile"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-primary transition-colors"
          activeClassName="text-primary"
        >
          <User className="h-6 w-6" />
          <span className="text-xs mt-0.5">Cá nhân</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default MobileNav;