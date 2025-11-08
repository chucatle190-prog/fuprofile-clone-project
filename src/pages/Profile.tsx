import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, MessageCircle, Heart, Users, Coins, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "@/components/PostCard";
import PhotosGrid from "@/components/profile/PhotosGrid";
import FriendsList from "@/components/profile/FriendsList";
import AboutSection from "@/components/profile/AboutSection";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  work: string | null;
  education: string | null;
  lives_in: string | null;
  from_location: string | null;
  relationship: string | null;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles: Profile;
}

interface Stats {
  posts: number;
  comments: number;
  reactions: number;
  friends: number;
  totalReward: number;
  totalUSD: number;
}

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<Stats>({
    posts: 0,
    comments: 0,
    reactions: 0,
    friends: 0,
    totalReward: 0,
    totalUSD: 0,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      
      setProfile(data);

      await fetchUserPosts(userId);
      await fetchStats(userId);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin cá nhân",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async (userId: string) => {
    const { data } = await supabase
      .from("posts")
      .select(`
        *,
        profiles:user_id (*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) setPosts(data as any);
  };

  const fetchStats = async (userId: string) => {
    const [postsCount, commentsCount, reactionsCount, friendsCount, wallet] = await Promise.all([
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("comments").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("reactions").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("friendships").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "accepted"),
      supabase.from("user_wallets").select("total_reward_camly, total_usd").eq("user_id", userId).maybeSingle(),
    ]);

    setStats({
      posts: postsCount.count || 0,
      comments: commentsCount.count || 0,
      reactions: reactionsCount.count || 0,
      friends: friendsCount.count || 0,
      totalReward: wallet.data?.total_reward_camly || 0,
      totalUSD: wallet.data?.total_usd || 0,
    });
  };

  const uploadImage = async (file: File, bucket: string, userId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Math.random()}.${fileExt}`;

    // Delete old file if exists
    const { data: existingFiles } = await supabase.storage
      .from(bucket)
      .list(userId);

    if (existingFiles && existingFiles.length > 0) {
      await supabase.storage
        .from(bucket)
        .remove(existingFiles.map(f => `${userId}/${f.name}`));
    }

    // Upload new file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file ảnh",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "Kích thước ảnh không được vượt quá 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const avatarUrl = await uploadImage(file, 'avatars', user.id);

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã cập nhật ảnh đại diện",
      });
      
      fetchProfile(user.id);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải ảnh lên",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file ảnh",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "Kích thước ảnh không được vượt quá 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const coverUrl = await uploadImage(file, 'covers', user.id);

      const { error } = await supabase
        .from("profiles")
        .update({ cover_url: coverUrl })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã cập nhật ảnh bìa",
      });
      
      fetchProfile(user.id);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải ảnh lên",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar user={user} />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar user={user} />
      <div className="flex">
        <LeftSidebar />
        <main className="flex-1 container max-w-4xl mx-auto mb-16 md:mb-0">
          {/* Cover & Profile Picture */}
          <div className="relative">
            <div className="h-80 bg-gradient-to-r from-primary/30 to-accent/30 rounded-b-xl relative overflow-hidden">
              {profile?.cover_url && (
                <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
              <Button
                size="sm"
                variant="secondary"
                className="absolute bottom-4 right-4"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Đang tải..." : "Chỉnh sửa ảnh bìa"}
              </Button>
            </div>
            
            <div className="px-6 -mt-16 relative">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-card">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                        {profile?.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full h-10 w-10"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-center md:text-left mb-4">
                    <h1 className="text-3xl font-bold">{profile?.full_name || profile?.username}</h1>
                    <p className="text-muted-foreground">@{profile?.username}</p>
                    {profile?.bio && <p className="mt-2 max-w-md">{profile.bio}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Honor Bar */}
          <Card className="mx-6 mt-4 shadow-soft">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-primary mb-1">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-2xl font-bold">{stats.posts}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Bài viết</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-primary mb-1">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-2xl font-bold">{stats.comments}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Bình luận</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-primary mb-1">
                    <Heart className="h-4 w-4" />
                    <span className="text-2xl font-bold">{stats.reactions}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Reactions</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-primary mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-2xl font-bold">{stats.friends}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Bạn bè</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-accent mb-1">
                    <Coins className="h-4 w-4" />
                    <span className="text-2xl font-bold">{stats.totalReward}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Camly Coin</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-accent mb-1">
                    <span className="text-2xl font-bold">${stats.totalUSD}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Total USD</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="px-6 mt-6">
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="posts">Bài viết</TabsTrigger>
                <TabsTrigger value="about">Giới thiệu</TabsTrigger>
                <TabsTrigger value="photos">Ảnh</TabsTrigger>
                <TabsTrigger value="friends">Bạn bè</TabsTrigger>
              </TabsList>
              
              <TabsContent value="posts" className="space-y-4 mt-4">
                {posts.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Chưa có bài viết nào</p>
                  </Card>
                ) : (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} currentUserId={user?.id} onUpdate={() => fetchUserPosts(user!.id)} />
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="about" className="mt-4">
                {profile && (
                  <AboutSection 
                    profile={profile} 
                    isOwnProfile={true}
                    onUpdate={() => fetchProfile(user!.id)}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="photos" className="mt-4">
                {user && <PhotosGrid userId={user.id} />}
              </TabsContent>
              
              <TabsContent value="friends" className="mt-4">
                {user && <FriendsList userId={user.id} />}
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <RightSidebar />
      </div>
      <MobileNav />
    </div>
  );
};

export default Profile;
