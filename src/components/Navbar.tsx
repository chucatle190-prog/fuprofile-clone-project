import { Home, LogOut, User, Bell, MessageCircle, Search, Users, Menu } from "lucide-react";
import { NavLink } from "./NavLink";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User as UserType } from "@supabase/supabase-js";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import logoVideo from "@/assets/logo-animated.mp4";

interface NavbarProps {
  user: UserType | null;
}

const Navbar = ({ user }: NavbarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { unreadCount } = useRealtimeNotifications(user?.id);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Đăng xuất thành công",
      description: "Hẹn gặp lại!",
    });
    navigate("/auth");
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-medium">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <NavLink to="/feed" className="flex-shrink-0">
          <video
            src={logoVideo}
            autoPlay
            loop
            muted
            playsInline
            className="h-12 w-auto rounded-lg object-contain"
          />
        </NavLink>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm trên F.U.Profile"
              className="w-full pl-10 bg-secondary/50 border-0"
            />
          </div>
        </div>

        {/* Center Navigation - Desktop */}
        <div className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-2xl">
          <NavLink
            to="/feed"
            className="flex items-center justify-center px-8 py-2 rounded-lg hover:bg-accent/50 transition-colors relative"
            activeClassName="text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-primary after:rounded-t"
          >
            <Home className="h-6 w-6" />
          </NavLink>

          <NavLink
            to="/friends"
            className="flex items-center justify-center px-8 py-2 rounded-lg hover:bg-accent/50 transition-colors relative"
            activeClassName="text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-primary after:rounded-t"
          >
            <Users className="h-6 w-6" />
          </NavLink>

          <NavLink
            to="/groups"
            className="flex items-center justify-center px-8 py-2 rounded-lg hover:bg-accent/50 transition-colors relative"
            activeClassName="text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-primary after:rounded-t"
          >
            <Menu className="h-6 w-6" />
          </NavLink>
        </div>

        {/* Right Icons - Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <NavLink
            to="/messages"
            className="relative p-2 rounded-full hover:bg-accent/50 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              3
            </Badge>
          </NavLink>

          <NavLink
            to="/notifications"
            className="relative p-2 rounded-full hover:bg-accent/50 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </NavLink>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                Trang cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Menu className="mr-2 h-4 w-4" />
                Cài đặt
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile - Search Icon */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="h-5 w-5" />
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;