import { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Trash2, Music, Volume2, VolumeX } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const currentStory = stories[currentIndex];
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setProgress(0);
    
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

      {/* Music info */}
      {currentStory.music_name && (
        <div className="absolute bottom-20 left-4 right-4 z-10">
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