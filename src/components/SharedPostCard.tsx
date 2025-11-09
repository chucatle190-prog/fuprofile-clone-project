import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { MessageCircle, Trash2, Send, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import ReactionPicker from "./ReactionPicker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles: Profile;
}

interface OriginalPost {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles: Profile;
}

interface Share {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  post_id: string;
  profiles: Profile;
  posts: OriginalPost;
}

interface SharedPostCardProps {
  share: Share;
  currentUserId?: string;
  onUpdate: () => void;
}

const SharedPostCard = ({ share, currentUserId, onUpdate }: SharedPostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentReaction, setCurrentReaction] = useState<string | undefined>();
  const [reactionsCount, setReactionsCount] = useState(0);
  const { toast } = useToast();

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          full_name
        )
      `)
      .eq("post_id", share.post_id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }

    setComments(data || []);
  };

  const fetchReactions = async () => {
    const { count } = await supabase
      .from("reactions")
      .select("*", { count: "exact", head: true })
      .eq("post_id", share.post_id);

    setReactionsCount(count || 0);

    if (currentUserId) {
      const { data } = await supabase
        .from("reactions")
        .select("reaction_type")
        .eq("post_id", share.post_id)
        .eq("user_id", currentUserId)
        .maybeSingle();

      setCurrentReaction(data?.reaction_type);
    }
  };

  useEffect(() => {
    fetchComments();
    fetchReactions();
  }, []);

  const handleReaction = async (reactionType: string) => {
    if (!currentUserId) return;

    try {
      if (currentReaction === reactionType) {
        await supabase
          .from("reactions")
          .delete()
          .eq("post_id", share.post_id)
          .eq("user_id", currentUserId);
        setCurrentReaction(undefined);
      } else {
        await supabase
          .from("reactions")
          .upsert({
            post_id: share.post_id,
            user_id: currentUserId,
            reaction_type: reactionType,
          });
        setCurrentReaction(reactionType);
      }

      await fetchReactions();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !newComment.trim()) return;

    try {
      await supabase.from("comments").insert({
        post_id: share.post_id,
        user_id: currentUserId,
        content: newComment,
      });

      setNewComment("");
      await fetchComments();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (currentUserId !== share.user_id) return;

    try {
      const { error } = await supabase.from("shares").delete().eq("id", share.id);
      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã xóa bài chia sẻ",
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-soft hover:shadow-medium transition-shadow">
      <CardContent className="p-4">
        {/* Share Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {share.profiles.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">
                {share.profiles.full_name || share.profiles.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(share.created_at), {
                  addSuffix: true,
                  locale: vi,
                })}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {currentUserId === share.user_id && (
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa bài chia sẻ
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Share Content */}
        {share.content && (
          <p className="text-foreground mb-3 whitespace-pre-wrap">{share.content}</p>
        )}

        {/* Original Post (nested) */}
        <div className="border border-border rounded-lg p-4 bg-muted/30 mb-3">
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {share.posts.profiles.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">
                {share.posts.profiles.full_name || share.posts.profiles.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(share.posts.created_at), {
                  addSuffix: true,
                  locale: vi,
                })}
              </p>
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap mb-2">{share.posts.content}</p>
          {share.posts.image_url && (
            <img
              src={share.posts.image_url}
              alt="Original post"
              className="w-full rounded-lg object-cover max-h-[400px]"
            />
          )}
        </div>

        {/* Reactions Summary */}
        <div className="flex items-center justify-between py-2 text-sm text-muted-foreground">
          <button className="hover:underline">
            {reactionsCount > 0 && `${reactionsCount} lượt thích`}
          </button>
          <div className="flex gap-2">
            {comments.length > 0 && (
              <button className="hover:underline" onClick={() => setShowComments(!showComments)}>
                {comments.length} bình luận
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1 py-1 border-t border-border">
          <ReactionPicker onReact={handleReaction} currentReaction={currentReaction} />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex-1 gap-2 text-muted-foreground hover:bg-accent/50"
          >
            <MessageCircle className="h-4 w-4" />
            Bình luận
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {comment.profiles.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-secondary/50 rounded-2xl px-3 py-2">
                    <p className="text-sm font-semibold">
                      {comment.profiles.full_name || comment.profiles.username}
                    </p>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-3">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Comment Input */}
            <form onSubmit={handleComment} className="flex gap-2 mt-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {currentUserId && "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Viết bình luận..."
                  className="flex-1 rounded-full bg-secondary/50"
                />
                <Button type="submit" size="icon" className="rounded-full flex-shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SharedPostCard;
