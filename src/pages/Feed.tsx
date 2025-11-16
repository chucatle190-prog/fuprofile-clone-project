import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import MobileNav from "@/components/MobileNav";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import SharedPostCard from "@/components/SharedPostCard";
import StoryCarousel from "@/components/StoryCarousel";
import FairyCursor from "@/components/FairyCursor";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  user_id: string;
  profiles: Profile;
}

interface Share {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  post_id: string;
  profiles: Profile;
  posts: Post;
}

type FeedItem = 
  | { type: 'post'; data: Post }
  | { type: 'share'; data: Share };

const Feed = () => {
  const [user, setUser] = useState<User | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const fetchFeed = async () => {
    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // Fetch shares with manual joins
      const { data: sharesData, error: sharesError } = await supabase
        .from("shares")
        .select("*")
        .order("created_at", { ascending: false });

      if (sharesError) throw sharesError;

      // Fetch related data for shares
      const enrichedShares: Share[] = [];
      if (sharesData) {
        for (const share of sharesData) {
          const { data: shareProfile } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url")
            .eq("id", share.user_id)
            .single();

          const { data: originalPost } = await supabase
            .from("posts")
            .select(`
              id,
              content,
              image_url,
              created_at,
              profiles:user_id (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq("id", share.post_id)
            .single();

          if (shareProfile && originalPost) {
            enrichedShares.push({
              ...share,
              profiles: shareProfile,
              posts: originalPost as Post,
            });
          }
        }
      }

      // Combine and sort by created_at
      const combined: FeedItem[] = [
        ...(postsData || []).map(post => ({ type: 'post' as const, data: post as Post })),
        ...enrichedShares.map(share => ({ type: 'share' as const, data: share })),
      ].sort((a, b) => {
        const dateA = new Date(a.data.created_at).getTime();
        const dateB = new Date(b.data.created_at).getTime();
        return dateB - dateA;
      });

      setFeedItems(combined);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải bài đăng",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();

    const postsChannel = supabase
      .channel("posts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        () => {
          fetchFeed();
        }
      )
      .subscribe();

    const sharesChannel = supabase
      .channel("shares")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shares",
        },
        () => {
          fetchFeed();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(sharesChannel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <FairyCursor />
      <Navbar user={user} />
      <div className="flex">
        <LeftSidebar />
        <main className="flex-1 container max-w-2xl mx-auto px-4 py-6 mb-16 md:mb-0">
          <StoryCarousel currentUserId={user?.id} />
          <CreatePost onPostCreated={fetchFeed} />
          <div className="space-y-4 mt-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Đang tải...</p>
              </div>
            ) : feedItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Chưa có bài đăng nào</p>
              </div>
            ) : (
              feedItems.map((item) => 
                item.type === 'post' ? (
                  <PostCard 
                    key={`post-${item.data.id}`} 
                    post={item.data} 
                    currentUserId={user?.id} 
                    onUpdate={fetchFeed} 
                  />
                ) : (
                  <SharedPostCard 
                    key={`share-${item.data.id}`} 
                    share={item.data} 
                    currentUserId={user?.id} 
                    onUpdate={fetchFeed} 
                  />
                )
              )
            )}
          </div>
        </main>
        <RightSidebar />
      </div>
      <MobileNav user={user} />
    </div>
  );
};

export default Feed;
