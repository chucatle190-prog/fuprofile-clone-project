import { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Trash2, Music, Volume2, VolumeX, Smile, Send, Image, Video } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import ReactionList from "./ReactionList";
import { Input } from "./ui/input";
import { useNavigate } from "react-router-dom";

const REACTIONS = ["❤️", "😂", "😢", "😍", "👍"];

interface Story {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  music_name?: string | null;
  music_artist?: string | null;
  music_url?: string | null;
  profiles: {
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  };
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  currentUserId?: string;
  onStoryDelete?: () => void;
}

const StoryViewer = ({ stories, initialIndex, onClose, currentUserId, onStoryDelete }: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [reactions, setReactions] = useState<{ [key: string]: number }>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const currentStory = stories[currentIndex];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setProgress(0);
    fetchReactions();
    
    // Subscribe to realtime reaction changes
    const reactionChannel = supabase
      .channel(`story_reactions:${currentStory?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'story_reactions',
          filter: `story_id=eq.${currentStory?.id}`,
        },
        () => {
          fetchReactions();
        }
      )
      .subscribe();
    
    // Play music if available
    if (currentStory?.music_url && audioRef.current) {
      audioRef.current.src = currentStory.music_url;
      audioRef.current.loop = true;
      audioRef.current.volume = isMuted ? 0 : 0.5;
      audioRef.current.play().catch(err => console.log("Audio play failed:", err));
    }
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(reactionChannel);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [currentIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : 0.5;
    }
  }, [isMuted]);

  const fetchReactions = async () => {
    if (!currentStory) return;

    const { data } = await supabase
      .from("story_reactions")
      .select("reaction_type, user_id")
      .eq("story_id", currentStory.id);

    if (data) {
      const reactionCounts: { [key: string]: number } = {};
      let myReaction: string | null = null;

      data.forEach((r) => {
        reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
        if (r.user_id === currentUserId) {
          myReaction = r.reaction_type;
        }
      });

      setReactions(reactionCounts);
      setUserReaction(myReaction);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!currentUserId || !currentStory) return;

    if (userReaction === emoji) {
      // Remove reaction
      await supabase
        .from("story_reactions")
        .delete()
        .eq("story_id", currentStory.id)
        .eq("user_id", currentUserId);
      
      setUserReaction(null);
      setReactions(prev => ({
        ...prev,
        [emoji]: Math.max((prev[emoji] || 1) - 1, 0)
      }));
    } else {
      // Add or update reaction
      await supabase
        .from("story_reactions")
        .upsert({
          story_id: currentStory.id,
          user_id: currentUserId,
          reaction_type: emoji,
        });

      // Create notification if reacting to someone else's story
      if (currentStory.user_id !== currentUserId) {
        await supabase
          .from("notifications")
          .insert({
            user_id: currentStory.user_id,
            type: "story_reaction",
            content: `${emoji} đã thả reaction vào story của bạn`,
            related_id: currentStory.id,
          });
      }

      setUserReaction(emoji);
      setReactions(prev => ({
        ...prev,
        ...(userReaction ? { [userReaction]: Math.max((prev[userReaction] || 1) - 1, 0) } : {}),
        [emoji]: (prev[emoji] || 0) + 1
      }));
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDelete = async () => {
    if (!currentStory || currentStory.user_id !== currentUserId) return;

    const { error } = await supabase
      .from("stories")
      .delete()
      .eq("id", currentStory.id);

    if (error) {
      toast.error("Không thể xóa story");
    } else {
      toast.success("Đã xóa story");
      onStoryDelete?.();
      if (stories.length === 1) {
        onClose();
      } else {
        handleNext();
      }
    }
  };

  const handleSendReply = async () => {
    if ((!replyMessage.trim() && !mediaFile) || !currentUserId || !currentStory) return;
    if (currentStory.user_id === currentUserId) {
      toast.error("Không thể gửi tin nhắn cho chính mình");
      return;
    }

    setUploading(true);
    try {
      let imageUrl = null;
      let videoUrl = null;

      // Upload media nếu có
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const isVideo = mediaFile.type.startsWith('video/');
        const bucket = isVideo ? 'videos' : 'avatars';
        const fileName = `${currentUserId}/reply_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, mediaFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        if (isVideo) {
          videoUrl = publicUrl;
        } else {
          imageUrl = publicUrl;
        }
      }

      // Tạo hoặc lấy conversation
      const { data: convId, error: convError } = await supabase
        .rpc('create_direct_conversation', { other_user_id: currentStory.user_id });

      if (convError) throw convError;

      // Tạo post với media nếu có
      if (imageUrl || videoUrl) {
        const { data: post, error: postError } = await supabase
          .from("posts")
          .insert({
            user_id: currentUserId,
            content: replyMessage.trim() || "Đã trả lời story của bạn",
            image_url: imageUrl,
            video_url: videoUrl,
          })
          .select()
          .single();

        if (postError) throw postError;

        // Gửi tin nhắn với link đến post
        const { error: msgError } = await supabase
          .from("messages")
          .insert({
            conversation_id: convId,
            sender_id: currentUserId,
            content: `${replyMessage.trim() || "Đã trả lời story của bạn"}\n[Xem media](${window.location.origin}/feed)`,
          });

        if (msgError) throw msgError;
      } else {
        // Gửi tin nhắn text thôi
        const { error: msgError } = await supabase
          .from("messages")
          .insert({
            conversation_id: convId,
            sender_id: currentUserId,
            content: replyMessage,
          });

        if (msgError) throw msgError;
      }

      toast.success("Đã gửi tin nhắn");
      setReplyMessage("");
      setMediaFile(null);
      setMediaPreview(null);
      setShowReplyInput(false);
      
      // Navigate to messages page
      setTimeout(() => {
        navigate("/messages");
      }, 500);
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Không thể gửi tin nhắn");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File quá lớn. Tối đa 20MB");
      return;
    }

    // Kiểm tra file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error("Chỉ hỗ trợ ảnh và video");
      return;
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const clearMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(null);
    setMediaPreview(null);
  };

  if (!currentStory) return null;

  const timeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diff = Math.floor((now.getTime() - created.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: index < currentIndex ? "100%" : index === currentIndex ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={currentStory.profiles.avatar_url || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {currentStory.profiles.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold text-sm">
              {currentStory.profiles.full_name || currentStory.profiles.username}
            </p>
            <p className="text-white/80 text-xs">{timeAgo(currentStory.created_at)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {currentStory.music_url && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          )}
          {currentStory.user_id === currentUserId && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleDelete}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Reactions */}
      <div className="absolute bottom-24 left-4 right-4 z-10">
        {!showReplyInput ? (
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {Object.entries(reactions).filter(([_, count]) => count > 0).map(([emoji, count]) => (
                <Popover key={emoji}>
                  <PopoverTrigger asChild>
                    <button className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 hover:bg-black/70 transition-colors">
                      <span className="text-lg">{emoji}</span>
                      <span className="text-white text-xs font-semibold">{count}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="start">
                    <ReactionList storyId={currentStory.id} reactionType={emoji} />
                  </PopoverContent>
                </Popover>
              ))}
            </div>

            <div className="flex gap-2">
              {currentStory.user_id !== currentUserId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-full"
                  onClick={() => setShowReplyInput(true)}
                >
                  <Send className="h-5 w-5" />
                </Button>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-full"
                  >
                    {userReaction ? (
                      <span className="text-xl">{userReaction}</span>
                    ) : (
                      <Smile className="h-5 w-5" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="end">
                  <div className="flex gap-1">
                    {REACTIONS.map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="icon"
                        className={`text-2xl hover:scale-125 transition-transform ${
                          userReaction === emoji ? "bg-accent" : ""
                        }`}
                        onClick={() => handleReaction(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Media preview */}
            {mediaPreview && (
              <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 relative">
                {mediaFile?.type.startsWith('video/') ? (
                  <video
                    src={mediaPreview}
                    className="max-h-48 rounded mx-auto"
                    controls
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="max-h-48 rounded mx-auto object-contain"
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 bg-black/70 text-white hover:bg-black rounded-full"
                  onClick={clearMedia}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Input box */}
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
              <Input
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Gửi tin nhắn..."
                className="bg-transparent border-none text-white placeholder:text-white/60 focus-visible:ring-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !uploading) {
                    handleSendReply();
                  }
                }}
                autoFocus
                disabled={uploading}
              />
              
              {/* Image button */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Image className="h-5 w-5" />
              </Button>

              {/* Video button */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full flex-shrink-0"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = "video/*";
                    fileInputRef.current.click();
                  }
                }}
                disabled={uploading}
              >
                <Video className="h-5 w-5" />
              </Button>

              {/* Send button */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full flex-shrink-0"
                onClick={handleSendReply}
                disabled={uploading || (!replyMessage.trim() && !mediaFile)}
              >
                <Send className="h-5 w-5" />
              </Button>

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full flex-shrink-0"
                onClick={() => {
                  setShowReplyInput(false);
                  setReplyMessage("");
                  clearMedia();
                }}
                disabled={uploading}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Music info */}
      {currentStory.music_name && (
        <div className="absolute bottom-48 left-4 right-4 z-10">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-white/20 flex items-center justify-center">
              <Music className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{currentStory.music_name}</p>
              <p className="text-white/80 text-xs truncate">{currentStory.music_artist}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      {currentIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 text-white hover:bg-white/20 z-10"
          onClick={handlePrevious}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}
      {currentIndex < stories.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 text-white hover:bg-white/20 z-10"
          onClick={handleNext}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Story image */}
      <img
        src={currentStory.image_url}
        alt="Story"
        className="max-h-full max-w-full object-contain"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width / 2) {
            handlePrevious();
          } else {
            handleNext();
          }
        }}
      />

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default StoryViewer;