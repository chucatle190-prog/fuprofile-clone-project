import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { songs } from "@/lib/musicLibrary";
import { toast } from "sonner";
import { Music, Save, Trash2 } from "lucide-react";

const LyricsAdmin = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const [selectedSongId, setSelectedSongId] = useState("");
  const [lyricsText, setLyricsText] = useState("");
  const [existingLyrics, setExistingLyrics] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (selectedSongId) {
      loadExistingLyrics();
    }
  }, [selectedSongId]);

  const loadExistingLyrics = async () => {
    const { data } = await supabase
      .from('song_lyrics')
      .select('*')
      .eq('song_id', selectedSongId)
      .maybeSingle();
    
    if (data) {
      setExistingLyrics(data);
      // Convert lyrics array to text format
      const lyricsArray = data.lyrics as any[];
      const text = lyricsArray.map(l => `[${l.startTime}-${l.endTime}] ${l.text}`).join('\n');
      setLyricsText(text);
    } else {
      setExistingLyrics(null);
      setLyricsText("");
    }
  };

  const parseLyrics = (text: string) => {
    const lines = text.trim().split('\n');
    return lines.map(line => {
      const match = line.match(/\[(\d+\.?\d*)-(\d+\.?\d*)\]\s*(.+)/);
      if (match) {
        return {
          startTime: parseFloat(match[1]),
          endTime: parseFloat(match[2]),
          text: match[3]
        };
      }
      return null;
    }).filter(Boolean);
  };

  const handleSave = async () => {
    if (!selectedSongId) {
      toast.error("Vui lòng chọn bài hát");
      return;
    }

    const song = songs.find(s => s.id === selectedSongId);
    if (!song) return;

    const lyricsArray = parseLyrics(lyricsText);
    if (lyricsArray.length === 0) {
      toast.error("Vui lòng nhập lời bài hát đúng format");
      return;
    }

    try {
      if (existingLyrics) {
        // Update
        const { error } = await supabase
          .from('song_lyrics')
          .update({
            lyrics: lyricsArray,
            title: song.title,
            artist: song.artist,
            updated_at: new Date().toISOString()
          })
          .eq('song_id', selectedSongId);

        if (error) throw error;
        toast.success("Đã cập nhật lời bài hát");
      } else {
        // Insert
        const { error } = await supabase
          .from('song_lyrics')
          .insert({
            song_id: selectedSongId,
            title: song.title,
            artist: song.artist,
            lyrics: lyricsArray
          });

        if (error) throw error;
        toast.success("Đã thêm lời bài hát");
      }
      
      loadExistingLyrics();
    } catch (error) {
      console.error("Error saving lyrics:", error);
      toast.error("Lỗi khi lưu lời bài hát");
    }
  };

  const handleDelete = async () => {
    if (!selectedSongId || !existingLyrics) return;

    try {
      const { error } = await supabase
        .from('song_lyrics')
        .delete()
        .eq('song_id', selectedSongId);

      if (error) throw error;
      toast.success("Đã xóa lời bài hát");
      setLyricsText("");
      setExistingLyrics(null);
    } catch (error) {
      console.error("Error deleting lyrics:", error);
      toast.error("Lỗi khi xóa lời bài hát");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Music className="h-6 w-6" />
              Quản lý Lời Bài Hát
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Thêm hoặc chỉnh sửa lời bài hát với timestamp
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Song Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Chọn bài hát</label>
              <Select value={selectedSongId} onValueChange={setSelectedSongId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn bài hát..." />
                </SelectTrigger>
                <SelectContent>
                  {songs.map(song => (
                    <SelectItem key={song.id} value={song.id}>
                      {song.title} - {song.artist}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Instructions */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">📝 Hướng dẫn định dạng:</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Mỗi dòng lời nhạc phải có format: <code className="bg-background px-1 rounded">[startTime-endTime] Lời bài hát</code>
                </p>
                <div className="bg-background p-3 rounded-md font-mono text-sm space-y-1">
                  <div>[0.0-2.5] Dòng lời đầu tiên</div>
                  <div>[2.5-5.0] Dòng lời thứ hai</div>
                  <div>[5.0-8.0] Dòng lời thứ ba</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  * startTime và endTime tính bằng giây (có thể dùng số thập phân)
                </p>
              </CardContent>
            </Card>

            {/* Lyrics Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Lời bài hát</label>
              <Textarea
                value={lyricsText}
                onChange={(e) => setLyricsText(e.target.value)}
                placeholder="[0.0-2.5] Dòng lời đầu tiên..."
                className="min-h-[400px] font-mono text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {existingLyrics ? "Cập nhật" : "Lưu"}
              </Button>
              {existingLyrics && (
                <Button onClick={handleDelete} variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa
                </Button>
              )}
            </div>

            {/* Status */}
            {selectedSongId && (
              <div className="text-sm text-muted-foreground text-center">
                {existingLyrics ? (
                  <span className="text-green-600">✓ Bài hát này đã có lời</span>
                ) : (
                  <span className="text-orange-600">⚠ Bài hát này chưa có lời</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LyricsAdmin;
