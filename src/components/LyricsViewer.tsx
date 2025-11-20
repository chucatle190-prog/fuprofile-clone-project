import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LyricLine } from "@/lib/musicLibrary";
import { Loader2, Music } from "lucide-react";

interface LyricsViewerProps {
  songId: string;
  currentTime: number;
  isPlaying: boolean;
}

export const LyricsViewer = ({ songId, currentTime, isPlaying }: LyricsViewerProps) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLyrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data, error } = await supabase
          .from("song_lyrics")
          .select("lyrics")
          .eq("song_id", songId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            setError("Lời nhạc chưa có sẵn cho bài hát này");
          } else {
            throw error;
          }
        } else if (data?.lyrics) {
          setLyrics(Array.isArray(data.lyrics) ? data.lyrics as unknown as LyricLine[] : []);
        }
      } catch (err) {
        console.error("Error fetching lyrics:", err);
        setError("Không thể tải lời nhạc");
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [songId]);

  // Slight delay to sync lyrics with audio (accounts for intro)
  const LYRICS_OFFSET = -0.1;

  const getCurrentLyricIndex = () => {
    const adjustedTime = currentTime + LYRICS_OFFSET;
    return lyrics.findIndex(
      (line) => adjustedTime >= line.startTime && adjustedTime < line.endTime
    );
  };

  const currentIndex = getCurrentLyricIndex();

  // Auto-scroll to current lyric with smooth animation
  useEffect(() => {
    if (currentIndex >= 0 && isPlaying) {
      const element = document.getElementById(`lyric-line-${currentIndex}`);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  }, [currentIndex, isPlaying]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Lời nhạc
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error || lyrics.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Lời nhạc
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground text-center">
            {error || "Lời nhạc chưa có sẵn"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Lời nhạc
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {lyrics.map((line, index) => {
              const isActive = index === currentIndex;
              const isPast = index < currentIndex;
              const isComing = index === currentIndex + 1;
              
              return (
                <p
                  key={index}
                  id={`lyric-line-${index}`}
                  className={`transition-all duration-500 ease-in-out text-center py-2 ${
                    isActive
                      ? "text-primary font-bold text-2xl scale-110 drop-shadow-lg"
                      : isPast
                      ? "text-muted-foreground text-sm opacity-40"
                      : isComing
                      ? "text-foreground text-lg opacity-85 font-semibold"
                      : "text-foreground/60 text-base opacity-60"
                  }`}
                  style={{
                    transform: isActive ? 'translateY(0)' : isPast ? 'translateY(-4px)' : 'translateY(0)',
                  }}
                >
                  {line.text}
                </p>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
