import { useState, useEffect, useRef } from "react";
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
import { Music, Save, Trash2, Wand2, Play, Pause } from "lucide-react";

const LyricsAdmin = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const [selectedSongId, setSelectedSongId] = useState("");
  const [lyricsText, setLyricsText] = useState("");
  const [existingLyrics, setExistingLyrics] = useState<any>(null);
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const selectedSong = songs.find(s => s.id === selectedSongId);

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
      const lyricsArray = data.lyrics as any[];
      if (mode === "simple") {
        const text = lyricsArray.map(l => l.text).join('\n');
        setLyricsText(text);
      } else {
        const text = lyricsArray.map(l => `[${l.startTime}-${l.endTime}] ${l.text}`).join('\n');
        setLyricsText(text);
      }
    } else {
      setExistingLyrics(null);
      setLyricsText("");
    }
  };

  const autoGenerateTimestamps = () => {
    if (!selectedSong || !lyricsText.trim()) {
      toast.error("Vui lòng chọn bài hát và nhập lời");
      return;
    }

    const [minutes, seconds] = selectedSong.duration.split(':').map(Number);
    const totalSeconds = minutes * 60 + seconds;

    const lines = lyricsText.trim().split('\n').filter(line => line.trim());
    const timePerLine = totalSeconds / lines.length;

    const generatedLyrics = lines.map((line, index) => {
      const startTime = (index * timePerLine).toFixed(1);
      const endTime = ((index + 1) * timePerLine).toFixed(1);
      return `[${startTime}-${endTime}] ${line}`;
    }).join('\n');

    setLyricsText(generatedLyrics);
    setMode("advanced");
    toast.success("Đã tự động tạo timestamp! Bạn có thể điều chỉnh nếu cần");
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
    if (!selectedSongId || !selectedSong) {
      toast.error("Vui lòng chọn bài hát");
      return;
    }

    let lyricsArray;
    if (mode === "simple") {
      const lines = lyricsText.trim().split('\n').filter(line => line.trim());
      const [minutes, seconds] = selectedSong.duration.split(':').map(Number);
      const totalSeconds = minutes * 60 + seconds;
      const timePerLine = totalSeconds / lines.length;

      lyricsArray = lines.map((line, index) => ({
        startTime: parseFloat((index * timePerLine).toFixed(1)),
        endTime: parseFloat(((index + 1) * timePerLine).toFixed(1)),
        text: line
      }));
    } else {
      lyricsArray = parseLyrics(lyricsText);
    }

    if (lyricsArray.length === 0) {
      toast.error("Vui lòng nhập lời bài hát");
      return;
    }

    try {
      if (existingLyrics) {
        const { error } = await supabase
          .from('song_lyrics')
          .update({
            lyrics: lyricsArray,
            title: selectedSong.title,
            artist: selectedSong.artist,
            updated_at: new Date().toISOString()
          })
          .eq('song_id', selectedSongId);

        if (error) throw error;
        toast.success("Đã cập nhật lời bài hát");
      } else {
        const { error } = await supabase
          .from('song_lyrics')
          .insert({
            song_id: selectedSongId,
            title: selectedSong.title,
            artist: selectedSong.artist,
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

  const togglePreview = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Music className="h-6 w-6" />
              Quản lý Lời Bài Hát (Siêu Đơn Giản!)
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              ✨ Chỉ cần paste lời - hệ thống tự động tính timestamp!
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Song Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">1️⃣ Chọn bài hát</label>
              <Select value={selectedSongId} onValueChange={setSelectedSongId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn bài hát..." />
                </SelectTrigger>
                <SelectContent>
                  {songs.map(song => (
                    <SelectItem key={song.id} value={song.id}>
                      {song.title} - {song.artist} ({song.duration})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview Player */}
            {selectedSong && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={selectedSong.imageUrl} 
                      alt={selectedSong.title}
                      className="w-16 h-16 rounded object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold">{selectedSong.title}</h4>
                      <p className="text-sm text-muted-foreground">{selectedSong.artist} • {selectedSong.duration}</p>
                    </div>
                    <Button onClick={togglePreview} size="icon" variant="outline">
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                  <audio 
                    ref={audioRef} 
                    src={selectedSong.audioUrl}
                    onEnded={() => setIsPlaying(false)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={mode === "simple" ? "default" : "outline"}
                onClick={() => setMode("simple")}
                className="flex-1"
              >
                ✨ Chế độ Đơn Giản
              </Button>
              <Button
                variant={mode === "advanced" ? "default" : "outline"}
                onClick={() => setMode("advanced")}
                className="flex-1"
              >
                🎯 Chế độ Nâng Cao
              </Button>
            </div>

            {/* Instructions */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                {mode === "simple" ? (
                  <>
                    <h3 className="font-semibold mb-2">2️⃣ Paste lời bài hát (mỗi dòng 1 câu):</h3>
                    <div className="bg-background p-3 rounded-md text-sm space-y-1">
                      <div className="text-muted-foreground">Ví dụ:</div>
                      <div>Dòng lời đầu tiên</div>
                      <div>Dòng lời thứ hai</div>
                      <div>Dòng lời thứ ba</div>
                    </div>
                    <p className="text-sm text-green-600 mt-2 font-medium">
                      ✓ Hệ thống sẽ TỰ ĐỘNG chia timestamp đều khi bạn nhấn "Lưu"
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold mb-2">2️⃣ Định dạng nâng cao:</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      <code className="bg-background px-1 rounded">[giây bắt đầu-giây kết thúc] Lời</code>
                    </p>
                    <div className="bg-background p-3 rounded-md font-mono text-sm space-y-1">
                      <div>[0.0-2.5] Dòng lời đầu tiên</div>
                      <div>[2.5-5.0] Dòng lời thứ hai</div>
                      <div>[5.0-8.0] Dòng lời thứ ba</div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Lyrics Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">3️⃣ Nhập lời bài hát</label>
                {mode === "simple" && lyricsText.trim() && (
                  <Button 
                    onClick={autoGenerateTimestamps} 
                    variant="outline" 
                    size="sm"
                    className="gap-2"
                  >
                    <Wand2 className="h-4 w-4" />
                    Xem Timestamp
                  </Button>
                )}
              </div>
              <Textarea
                value={lyricsText}
                onChange={(e) => setLyricsText(e.target.value)}
                placeholder={
                  mode === "simple" 
                    ? "Paste lời bài hát vào đây...\nMỗi dòng một câu\nĐừng lo về timestamp!" 
                    : "[0.0-2.5] Dòng lời đầu tiên\n[2.5-5.0] Dòng lời thứ hai..."
                }
                className="min-h-[400px] text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1" size="lg">
                <Save className="h-4 w-4 mr-2" />
                4️⃣ {existingLyrics ? "Cập nhật" : "Lưu Lời Bài Hát"}
              </Button>
              {existingLyrics && (
                <Button onClick={handleDelete} variant="destructive" size="lg">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa
                </Button>
              )}
            </div>

            {/* Status */}
            {selectedSongId && (
              <div className="text-center p-3 rounded-lg bg-muted/30">
                {existingLyrics ? (
                  <span className="text-green-600 font-medium">✓ Bài hát này đã có lời</span>
                ) : (
                  <span className="text-orange-600 font-medium">⚠ Bài hát này chưa có lời</span>
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
