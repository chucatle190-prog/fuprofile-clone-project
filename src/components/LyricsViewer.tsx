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

  const getCurrentLyricIndex = () => {
    if (!isPlaying) return -1;
    return lyrics.findIndex(
      (line) => currentTime >= line.startTime && currentTime < line.endTime
    );
  };

  const currentIndex = getCurrentLyricIndex();

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
            {lyrics.map((line, index) => (
              <p
                key={index}
                className={`transition-all duration-300 text-center ${
                  index === currentIndex
                    ? "text-primary font-bold text-xl scale-105"
                    : index < currentIndex
                    ? "text-muted-foreground text-sm opacity-50"
                    : "text-foreground text-base opacity-70"
                }`}
              >
                {line.text}
              </p>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
