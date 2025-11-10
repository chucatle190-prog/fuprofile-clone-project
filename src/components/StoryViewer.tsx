import { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Trash2, Music, Volume2, VolumeX } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const REACTION_EMOJIS = ["😍", "😂", "😢", "👍", "❤️"];

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
  const [reactions, setReactions] = useState<{ [key: string]: { emoji: string; count: number }[] }>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const currentStory = stories[currentIndex];
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setProgress(0);
    fetchReactions();
    
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

    // Subscribe to reaction changes
    const channel = supabase
      .channel(`story_reactions:${currentStory?.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "story_reactions",
          filter: `story_id=eq.${currentStory?.id}`,
        },
        () => fetchReactions()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      supabase.removeChannel(channel);
    };
  }, [currentIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : 0.5;
    }
  }, [isMuted]);

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

  const fetchReactions = async () => {
    if (!currentStory) return;

    const { data, error } = await supabase
      .from("story_reactions")
      .select("reaction_type, user_id")
      .eq("story_id", currentStory.id);

    if (!error && data) {
      const grouped = data.reduce((acc: { [key: string]: number }, r) => {
        acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
        return acc;
      }, {});

      const reactionList = Object.entries(grouped).map(([emoji, count]) => ({
        emoji,
        count: count as number,
      }));

      setReactions({ [currentStory.id]: reactionList });

      const userReactionData = data.find((r) => r.user_id === currentUserId);
      setUserReaction(userReactionData?.reaction_type || null);
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
    } else {
      // Add or update reaction
      await supabase
        .from("story_reactions")
        .upsert({
          story_id: currentStory.id,
          user_id: currentUserId,
          reaction_type: emoji,
        });
      setUserReaction(emoji);
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
      {currentUserId && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center justify-center gap-2 bg-black/50 backdrop-blur-sm rounded-full p-3">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`text-2xl transition-transform hover:scale-125 ${
                  userReaction === emoji ? "scale-125" : ""
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          {reactions[currentStory.id]?.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-2">
              {reactions[currentStory.id].map((r) => (
                <div
                  key={r.emoji}
                  className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1"
                >
                  <span className="text-lg">{r.emoji}</span>
                  <span className="text-white text-sm font-semibold">{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Music info */}
      {currentStory.music_name && (
        <div className="absolute bottom-32 left-4 right-4 z-10">
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
    </div>
  );
};

export default StoryViewer;