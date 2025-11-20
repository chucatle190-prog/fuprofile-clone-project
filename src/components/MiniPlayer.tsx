import { useEffect, useRef } from "react";
import { useMusicPlayer } from "@/hooks/useMusicPlayer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, X } from "lucide-react";
import { songs } from "@/lib/musicLibrary";

export const MiniPlayer = () => {
  const {
    currentSong,
    currentSongIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeatMode,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    setAudioElement,
    setCurrentSong,
    playNext,
    playPrevious,
  } = useMusicPlayer();

  const audioRef = useRef<HTMLAudioElement>(null);

  // Register audio element with global music player
  useEffect(() => {
    if (audioRef.current) {
      setAudioElement(audioRef.current);
      // Ensure audio is never muted for music playback
      audioRef.current.muted = false;
    }
  }, [setAudioElement]);

  // Update audio time and duration
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      // Use playNext from useMusicPlayer which handles repeat modes
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        playNext();
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [setCurrentTime, setDuration, playNext, repeatMode]);

  // Sync volume changes to audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  // Update audio source when song changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentSong) {
      audio.src = currentSong.audioUrl;
      if (isPlaying) {
        audio.play().catch(console.error);
      }
    }
  }, [currentSong, isPlaying]);

  const handleSeek = (value: number[]) => {
    const audio = useMusicPlayer.getState().audioElement;
    if (audio) {
      audio.currentTime = value[0];
    }
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };


  const handleClose = () => {
    setIsPlaying(false);
    setCurrentSong(null, 0);
  };

  if (!currentSong) return null;

  return (
    <div className="fixed top-16 left-0 right-0 bg-card/95 backdrop-blur-sm border-b border-border shadow-lg z-40 animate-in slide-in-from-top">
      <audio ref={audioRef} />
      
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center gap-4">
          {/* Song Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img 
              src={currentSong.imageUrl} 
              alt={currentSong.title}
              className="w-12 h-12 rounded object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate text-sm">{currentSong.title}</p>
              <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={playPrevious}
              disabled={currentSongIndex === 0 && repeatMode !== 'all'}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={playNext}
              disabled={currentSongIndex === songs.length - 1 && !repeatMode}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs">
            <span className="text-xs text-muted-foreground w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            <span className="text-xs text-muted-foreground w-10">
              {formatTime(duration)}
            </span>
          </div>

          {/* Volume */}
          <div className="hidden lg:flex items-center gap-2 w-32">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="cursor-pointer"
            />
          </div>

          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
