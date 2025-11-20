import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music as MusicIcon, Play, Pause, SkipBack, SkipForward, Volume2, ExternalLink, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { songs, Song } from "@/lib/musicLibrary";

const Music = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const playlistUrl = "https://suno.com/playlist/780671e0-02c4-467d-8ddb-b6e9a2ede0f5";
  
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentSong = songs[currentSongIndex];

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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (currentSongIndex < songs.length - 1) {
        setCurrentSongIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentSongIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Audio play error:", error);
          setIsPlaying(false);
          setIsLoading(false);
        });
      }
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSongIndex]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (currentSongIndex < songs.length - 1) {
      setCurrentSongIndex(prev => prev + 1);
      setIsPlaying(true);
    }
  };

  const playPrevious = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex(prev => prev - 1);
      setIsPlaying(true);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const playSong = (index: number) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          <LeftSidebar />

          <main className="flex-1 max-w-4xl mx-auto space-y-6">
            <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <MusicIcon className="h-16 w-16 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  🎵 Nghe Nhạc Happy Camly
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  Thư viện nhạc độc quyền của cộng đồng Happy Camly
                </p>
              </CardHeader>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Current Playing Song Display */}
                  <div className="relative w-full max-w-md mx-auto">
                    <div className="aspect-square rounded-lg overflow-hidden shadow-2xl border-2 border-primary/20">
                      <img 
                        src={currentSong.imageUrl} 
                        alt={currentSong.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-4 text-center">
                      <h3 className="text-2xl font-bold mb-1">{currentSong.title}</h3>
                      <p className="text-muted-foreground">{currentSong.artist}</p>
                    </div>
                  </div>

                  {/* Audio Element */}
                  <audio ref={audioRef} src={currentSong.audioUrl} />

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Slider
                      value={[currentTime]}
                      max={duration || 100}
                      step={1}
                      onValueChange={handleSeek}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Player Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={playPrevious}
                      disabled={currentSongIndex === 0}
                      className="h-12 w-12"
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>
                    
                    <Button
                      size="icon"
                      onClick={togglePlayPause}
                      disabled={isLoading}
                      className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90"
                    >
                      {isLoading ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="h-8 w-8" />
                      ) : (
                        <Play className="h-8 w-8 ml-1" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={playNext}
                      disabled={currentSongIndex === songs.length - 1}
                      className="h-12 w-12"
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center gap-3 max-w-xs mx-auto">
                    <Volume2 className="h-5 w-5 text-muted-foreground" />
                    <Slider
                      value={[volume * 100]}
                      max={100}
                      step={1}
                      onValueChange={(value) => setVolume(value[0] / 100)}
                      className="flex-1"
                    />
                  </div>

                  {/* Song List */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <MusicIcon className="h-5 w-5" />
                      Danh sách phát ({songs.length} bài)
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {songs.map((song, index) => (
                        <button
                          key={song.id}
                          onClick={() => playSong(index)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left ${
                            index === currentSongIndex ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                            <img src={song.imageUrl} alt={song.title} className="w-full h-full object-cover" />
                            {index === currentSongIndex && isPlaying && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${index === currentSongIndex ? 'text-primary' : ''}`}>
                              {song.title}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                          </div>
                          <span className="text-sm text-muted-foreground">{song.duration}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* External Link */}
                  <Button
                    variant="outline"
                    onClick={() => window.open(playlistUrl, '_blank')}
                    className="w-full gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Xem playlist đầy đủ trên Suno
                  </Button>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-full">
                          <MusicIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Playlist</p>
                          <p className="text-lg font-bold">Happy Camly</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary/20 rounded-full">
                          <Play className="h-5 w-5 text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tự động</p>
                          <p className="text-lg font-bold">Cập nhật</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/20 rounded-full">
                          <MusicIcon className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Chất lượng</p>
                          <p className="text-lg font-bold">Cao</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground text-center">
                      💡 <strong>Lưu ý:</strong> Playlist này tự động cập nhật khi có bài hát mới được thêm vào. 
                      Làm mới trang để xem nội dung mới nhất.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>

          <div className="hidden lg:block">
            <RightSidebar />
          </div>
        </div>
      </div>

      <MobileNav user={user} />
    </div>
  );
};

export default Music;
