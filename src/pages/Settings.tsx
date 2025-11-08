import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, User as UserIcon, Bell, Lock, Palette, LogOut, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Profile {
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
}

const Settings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Profile form state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [likeNotifications, setLikeNotifications] = useState(true);
  const [friendRequestNotifications, setFriendRequestNotifications] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setEmail(session.user.email || "");
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setEmail(session.user.email || "");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
      setFullName(data.full_name || "");
      setUsername(data.username || "");
      setBio(data.bio || "");
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        username: username,
        bio: bio,
      })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      toast.error("Không thể cập nhật thông tin");
    } else {
      toast.success("Đã cập nhật thông tin thành công");
      fetchProfile(user.id);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      toast.error("Không thể đổi mật khẩu");
    } else {
      toast.success("Đã đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    // First delete profile
    await supabase.from("profiles").delete().eq("id", user.id);
    
    // Then sign out
    await supabase.auth.signOut();
    toast.success("Tài khoản đã được xóa");
    navigate("/auth");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar user={user} />
      <div className="flex">
        <LeftSidebar />
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-6 mb-16 md:mb-0">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                Cài đặt
              </CardTitle>
              <CardDescription>Quản lý tài khoản và tùy chọn của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Hồ sơ</span>
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <span className="hidden sm:inline">Thông báo</span>
                  </TabsTrigger>
                  <TabsTrigger value="privacy" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="hidden sm:inline">Bảo mật</span>
                  </TabsTrigger>
                  <TabsTrigger value="account" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">Tài khoản</span>
                  </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullname">Họ và tên</Label>
                      <Input
                        id="fullname"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nhập họ và tên của bạn"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Tên người dùng</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Nhập tên người dùng"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Email không thể thay đổi</p>
                    </div>
                    <div>
                      <Label htmlFor="bio">Giới thiệu</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Viết vài dòng về bản thân..."
                        rows={4}
                      />
                    </div>
                    <Button onClick={handleUpdateProfile} disabled={loading} className="w-full">
                      {loading ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                  </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Thông báo qua Email</p>
                        <p className="text-sm text-muted-foreground">Nhận thông báo qua email</p>
                      </div>
                      <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Thông báo đẩy</p>
                        <p className="text-sm text-muted-foreground">Nhận thông báo trên trình duyệt</p>
                      </div>
                      <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Bình luận</p>
                        <p className="text-sm text-muted-foreground">Ai đó bình luận bài viết của bạn</p>
                      </div>
                      <Switch checked={commentNotifications} onCheckedChange={setCommentNotifications} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Thích và Reactions</p>
                        <p className="text-sm text-muted-foreground">Ai đó thích bài viết của bạn</p>
                      </div>
                      <Switch checked={likeNotifications} onCheckedChange={setLikeNotifications} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Lời mời kết bạn</p>
                        <p className="text-sm text-muted-foreground">Ai đó gửi lời mời kết bạn</p>
                      </div>
                      <Switch checked={friendRequestNotifications} onCheckedChange={setFriendRequestNotifications} />
                    </div>
                  </div>
                </TabsContent>

                {/* Privacy Tab */}
                <TabsContent value="privacy" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Đổi mật khẩu</h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                          <Input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Nhập mật khẩu hiện tại"
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-password">Mật khẩu mới</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Nhập mật khẩu mới"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Nhập lại mật khẩu mới"
                          />
                        </div>
                        <Button onClick={handleChangePassword} disabled={loading} className="w-full">
                          {loading ? "Đang đổi..." : "Đổi mật khẩu"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Account Tab */}
                <TabsContent value="account" className="space-y-4">
                  <div className="space-y-4">
                    <div className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <LogOut className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">Đăng xuất</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">Đăng xuất khỏi tài khoản của bạn</p>
                      <Button variant="outline" onClick={handleLogout} className="w-full">
                        Đăng xuất
                      </Button>
                    </div>

                    <Separator />

                    <div className="border border-destructive/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <h3 className="font-semibold text-destructive">Vùng nguy hiểm</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Xóa tài khoản sẽ xóa vĩnh viễn tất cả dữ liệu của bạn. Hành động này không thể hoàn tác.
                      </p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full">
                            Xóa tài khoản
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Bạn có chắc chắn muốn xóa tài khoản?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn khỏi hệ thống.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Xóa tài khoản
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
        <RightSidebar />
      </div>
      <MobileNav />
    </div>
  );
};

export default Settings;