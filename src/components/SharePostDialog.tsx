import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles: {
    username: string;
    full_name: string | null;
  };
}

interface SharePostDialogProps {
  post: Post;
  currentUserId?: string;
  onShareComplete: () => void;
}

const SharePostDialog = ({ post, currentUserId, onShareComplete }: SharePostDialogProps) => {
  const [open, setOpen] = useState(false);
  const [shareContent, setShareContent] = useState("");
  const [sharing, setSharing] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!currentUserId) return;

    setSharing(true);
    try {
      const { error } = await supabase.from("shares").insert({
        post_id: post.id,
        user_id: currentUserId,
        content: shareContent.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã chia sẻ bài viết",
      });

      setShareContent("");
      setOpen(false);
      onShareComplete();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-2 text-muted-foreground hover:bg-accent/50"
        >
          <Share2 className="h-4 w-4" />
          Chia sẻ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Chia sẻ bài viết</DialogTitle>
          <DialogDescription>
            Thêm suy nghĩ của bạn trước khi chia sẻ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={shareContent}
            onChange={(e) => setShareContent(e.target.value)}
            placeholder="Nói gì đó về bài viết này..."
            className="min-h-[100px]"
          />

          {/* Original Post Preview */}
          <div className="border border-border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {post.profiles.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">
                  {post.profiles.full_name || post.profiles.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </p>
              </div>
            </div>
            <p className="text-sm whitespace-pre-wrap line-clamp-3">{post.content}</p>
            {post.image_url && (
              <img
                src={post.image_url}
                alt="Preview"
                className="w-full rounded-lg mt-2 max-h-48 object-cover"
              />
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleShare} disabled={sharing}>
              {sharing ? "Đang chia sẻ..." : "Chia sẻ ngay"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SharePostDialog;
