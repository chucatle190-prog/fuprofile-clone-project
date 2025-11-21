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
import { Share2, Link2, Facebook, Twitter, MessageCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Confetti } from "@/components/games/Confetti";
import { Separator } from "@/components/ui/separator";

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
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast();

  const handleShareToWall = async () => {
    if (!currentUserId) return;

    setSharing(true);
    try {
      const { error } = await supabase.from("shares").insert({
        post_id: post.id,
        user_id: currentUserId,
        content: shareContent.trim() || null,
      });

      if (error) throw error;

      setShowConfetti(true);
      toast({
        title: "🎉 Thành công!",
        description: "Đã chia sẻ bài viết lên tường của bạn",
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

  const handleCopyLink = async () => {
    const postUrl = `${window.location.origin}/feed?post=${post.id}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      toast({
        title: "✅ Đã copy!",
        description: "Link bài viết đã được sao chép",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể copy link",
        variant: "destructive",
      });
    }
  };

  const handleExternalShare = async (platform: string) => {
    const postUrl = `${window.location.origin}/feed?post=${post.id}`;
    const text = `${shareContent || post.content.substring(0, 100)}`;

    // Try Web Share API first (works on mobile)
    if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: "Chia sẻ bài viết",
          text: text,
          url: postUrl,
        });
        setShowConfetti(true);
        return;
      } catch (error) {
        console.log("Web Share API not available, using fallback");
      }
    }

    // Fallback to platform-specific URLs
    const shareUrls: { [key: string]: string } = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(text)}`,
      messenger: `fb-messenger://share?link=${encodeURIComponent(postUrl)}`,
      zalo: `https://zalo.me/share?url=${encodeURIComponent(postUrl)}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
      setShowConfetti(true);
      toast({
        title: "🚀 Đang mở...",
        description: `Chia sẻ qua ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
      });
    }
  };

  return (
    <>
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      
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
              Chọn cách bạn muốn chia sẻ bài viết này
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Share Options */}
            <div className="space-y-2">
              <Button
                onClick={handleShareToWall}
                disabled={sharing}
                className="w-full justify-start gap-3 h-auto py-3"
                variant="outline"
              >
                <div className="bg-primary/10 p-2 rounded-full">
                  <Share2 className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Chia sẻ lên tường</div>
                  <div className="text-sm text-muted-foreground">Đăng bài viết này lên tường cá nhân</div>
                </div>
              </Button>

              <Button
                onClick={handleCopyLink}
                className="w-full justify-start gap-3 h-auto py-3"
                variant="outline"
              >
                <div className="bg-primary/10 p-2 rounded-full">
                  <Link2 className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Copy link</div>
                  <div className="text-sm text-muted-foreground">Sao chép đường dẫn bài viết</div>
                </div>
              </Button>
            </div>

            <Separator />

            {/* External Share */}
            <div>
              <p className="text-sm font-medium mb-3">Chia sẻ ra ngoài</p>
              <div className="grid grid-cols-5 gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full"
                  onClick={() => handleExternalShare("facebook")}
                  title="Facebook"
                >
                  <Facebook className="h-6 w-6 text-blue-600" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full"
                  onClick={() => handleExternalShare("messenger")}
                  title="Messenger"
                >
                  <MessageCircle className="h-6 w-6 text-blue-500" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full"
                  onClick={() => handleExternalShare("twitter")}
                  title="Twitter"
                >
                  <Twitter className="h-6 w-6 text-sky-500" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full"
                  onClick={() => handleExternalShare("telegram")}
                  title="Telegram"
                >
                  <Send className="h-6 w-6 text-blue-400" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                  onClick={() => handleExternalShare("zalo")}
                  title="Zalo"
                >
                  <span className="font-bold text-lg">Z</span>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Caption for wall share */}
            <Textarea
              value={shareContent}
              onChange={(e) => setShareContent(e.target.value)}
              placeholder="Thêm lời nhắn của bạn... (tùy chọn)"
              className="min-h-[80px]"
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SharePostDialog;
