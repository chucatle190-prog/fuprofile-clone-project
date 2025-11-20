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
import { Music as MusicIcon, Play, Pause, SkipBack, SkipForward, Volume2, ExternalLink, Shuffle, Repeat, Repeat1, Heart } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { songs } from "@/lib/musicLibrary";
import { LyricsViewer } from "@/components/LyricsViewer";
import { toast } from "sonner";
import { useMusicPlayer } from "@/hooks/useMusicPlayer";

const Music = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const playlistUrl = "https://suno.com/playlist/780671e0-02c4-467d-8ddb-b6e9a2ede0f5";
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [favoriteSongs, setFavoriteSongs] = useState<string[]>([]);
  
  const {
    currentSong,
    currentSongIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffle,
    repeatMode,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    toggleShuffle,
    cycleRepeatMode,
    setCurrentSong,
    setAudioElement,
    playNext,
    playPrevious,
  } = useMusicPlayer();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadFavorites(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadFavorites(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Initialize audio element
  useEffect(() => {
    if (audioRef.current) {
      setAudioElement(audioRef.current);
    }
  }, [setAudioElement]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (repeatMode === 'all' || currentSongIndex < songs.length - 1) {
        playNext();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [setCurrentTime, setDuration, repeatMode, currentSongIndex, setIsPlaying, playNext]);

  // Initialize first song if none is playing
  useEffect(() => {
    if (!currentSong && songs.length > 0) {
      setCurrentSong(songs[0], 0);
    }
  }, [currentSong, setCurrentSong]);

  // Update audio source when song changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentSong) {
      audio.src = currentSong.audioUrl;
      audio.volume = volume;
      if (isPlaying) {
        audio.play().catch(console.error);
      }
    }
  }, [currentSong, volume, isPlaying]);

  const loadFavorites = async (userId: string) => {
    const { data } = await supabase
      .from('favorite_songs')
      .select('song_id')
      .eq('user_id', userId);
    
    if (data) {
      setFavoriteSongs(data.map(f => f.song_id));
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

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

  const playSong = (index: number) => {
    setCurrentSong(songs[index], index);
    setIsPlaying(true);
  };

  const toggleFavorite = async (songId: string) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thêm yêu thích");
      return;
    }

    const isFavorite = favoriteSongs.includes(songId);

    if (isFavorite) {
      const { error } = await supabase
        .from('favorite_songs')
        .delete()
        .eq('user_id', user.id)
        .eq('song_id', songId);
      
      if (!error) {
        setFavoriteSongs(prev => prev.filter(id => id !== songId));
        toast.success("Đã xóa khỏi yêu thích");
      }
    } else {
      const { error } = await supabase
        .from('favorite_songs')
        .insert({ user_id: user.id, song_id: songId });
      
      if (!error) {
        setFavoriteSongs(prev => [...prev, songId]);
        toast.success("Đã thêm vào yêu thích");
      }
    }
  };

  const getRepeatIcon = () => {
    if (repeatMode === 'one') return <Repeat1 className="h-4 w-4" />;
    return <Repeat className="h-4 w-4" />;
  };

  const getRepeatLabel = () => {
    if (repeatMode === 'off') return 'Tắt lặp';
    if (repeatMode === 'all') return 'Lặp tất cả';
    return 'Lặp 1 bài';
  };

  const favoriteSongsList = songs.filter(song => favoriteSongs.includes(song.id));

  if (!currentSong) return null;

  return (
    <div className="min-h-screen bg-background">
      <audio ref={audioRef} />
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="flex gap-6">
          <LeftSidebar />

          <main className="flex-1 max-w-6xl mx-auto space-y-6">
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
                <Tabs defaultValue="player">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="player">
                      <MusicIcon className="h-4 w-4 mr-2" />
                      Đang phát
                    </TabsTrigger>
                    <TabsTrigger value="favorites">
                      <Heart className="h-4 w-4 mr-2" />
                      Yêu thích ({favoriteSongs.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="player" className="space-y-6">
                    {/* Two Column Layout: Player + Lyrics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column: Player */}
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
                            <div className="flex items-center justify-center gap-3 mb-1">
                              <h3 className="text-2xl font-bold">{currentSong.title}</h3>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleFavorite(currentSong.id)}
                                className="hover:scale-110 transition-transform"
                              >
                                <Heart 
                                  className={`h-6 w-6 ${
                                    favoriteSongs.includes(currentSong.id) 
                                      ? 'fill-red-500 text-red-500' 
                                      : 'text-muted-foreground'
                                  }`} 
                                />
                              </Button>
                            </div>
                            <p className="text-muted-foreground">{currentSong.artist}</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <Slider
                            value={[currentTime]}
                            max={duration || 100}
                            step={1}
                            onValueChange={handleSeek}
                            className="cursor-pointer"
                          />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                          </div>
                        </div>

                        {/* Playback Controls */}
                        <div className="flex items-center justify-center gap-6">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleShuffle}
                            className={isShuffle ? 'text-primary' : 'text-muted-foreground'}
                            title="Phát ngẫu nhiên"
                          >
                            <Shuffle className="h-5 w-5" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={playPrevious}
                            disabled={currentSongIndex === 0 && !isShuffle && repeatMode !== 'all'}
                          >
                            <SkipBack className="h-5 w-5" />
                          </Button>

                          <Button
                            size="icon"
                            className="h-14 w-14 rounded-full"
                            onClick={togglePlay}
                          >
                            {isPlaying ? (
                              <Pause className="h-6 w-6" />
                            ) : (
                              <Play className="h-6 w-6" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={playNext}
                            disabled={currentSongIndex === songs.length - 1 && !isShuffle && repeatMode !== 'all'}
                          >
                            <SkipForward className="h-5 w-5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={cycleRepeatMode}
                            className={repeatMode !== 'off' ? 'text-primary' : 'text-muted-foreground'}
                            title={getRepeatLabel()}
                          >
                            {getRepeatIcon()}
                          </Button>
                        </div>

                        {/* Volume Control */}
                        <div className="flex items-center gap-3 max-w-xs mx-auto">
                          <Volume2 className="h-5 w-5 text-muted-foreground" />
                          <Slider
                            value={[volume * 100]}
                            max={100}
                            step={1}
                            onValueChange={handleVolumeChange}
                            className="cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Right Column: Lyrics */}
                      <div className="lg:sticky lg:top-6 lg:self-start">
                        <LyricsViewer 
                          songId={currentSong.id} 
                          currentTime={currentTime} 
                          isPlaying={isPlaying}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="favorites" className="space-y-4">
                    {favoriteSongsList.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-lg">
                          Chưa có bài hát yêu thích
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Nhấn vào icon trái tim để thêm bài hát vào danh sách yêu thích
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {favoriteSongsList.map((song) => (
                          <div
                            key={song.id}
                            className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all hover:bg-accent ${
                              currentSong.id === song.id ? 'bg-primary/10 border-2 border-primary' : 'bg-card border-2 border-transparent'
                            }`}
                            onClick={() => playSong(songs.findIndex(s => s.id === song.id))}
                          >
                            <img 
                              src={song.imageUrl} 
                              alt={song.title}
                              className="w-16 h-16 rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">{song.title}</h4>
                              <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                              <p className="text-xs text-muted-foreground">{song.duration}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(song.id);
                              }}
                            >
                              <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                            </Button>
                            {currentSong.id === song.id && (
                              <div className="flex items-center gap-1">
                                <div className="w-1 h-4 bg-primary animate-pulse" />
                                <div className="w-1 h-6 bg-primary animate-pulse delay-75" />
                                <div className="w-1 h-4 bg-primary animate-pulse delay-150" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Song List */}
            <Card>
              <CardHeader>
                <CardTitle>Danh sách bài hát</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Chạm vào một bài để phát, nhấn trái tim để thêm vào yêu thích.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {songs.map((song, index) => (
                    <button
                      key={song.id}
                      type="button"
                      onClick={() => playSong(index)}
                      className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-accent ${
                        currentSong.id === song.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <img
                        src={song.imageUrl}
                        alt={song.title}
                        className="w-14 h-14 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{song.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                        <p className="text-xs text-muted-foreground">{song.duration}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-3">
                        {currentSong.id === song.id && (
                          <span className="text-xs font-medium text-primary">Đang phát</span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(song.id);
                          }}
                        >
                          <Heart
                            className={`h-5 w-5 ${
                              favoriteSongs.includes(song.id)
                                ? "fill-red-500 text-red-500"
                                : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Full Playlist Link */}
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Bạn muốn xem toàn bộ playlist?
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(playlistUrl, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Mở playlist trên Suno
                </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3">📚 Về Playlist</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Đây là playlist được tuyển chọn đặc biệt dành cho cộng đồng Happy Camly. 
                  Tất cả các bài hát đều được tạo ra với tâm huyết và yêu thương. 
                  Hãy thưởng thức và chia sẻ với bạn bè nhé! ❤️
                </p>
              </CardContent>
            </Card>
          </main>

          <RightSidebar />
        </div>
      </div>

      <MobileNav />
    </div>
  );
};

export default Music;
