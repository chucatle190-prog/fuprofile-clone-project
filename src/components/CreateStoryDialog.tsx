import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { musicLibrary, MusicTrack } from "@/lib/musicLibrary";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onStoryCreated: () => void;
}

const CreateStoryDialog = ({ open, onOpenChange, userId, onStoryCreated }: CreateStoryDialogProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleMusicSelect = (track: MusicTrack) => {
    setSelectedMusic(track);
    setShowMusicPicker(false);
    
    // Play preview
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.play();
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      // Upload to avatars bucket (reusing for stories)
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/story_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Create story in database with music
      const { error: dbError } = await supabase
        .from('stories')
        .insert({
          user_id: userId,
          image_url: data.publicUrl,
          music_name: selectedMusic?.name,
          music_artist: selectedMusic?.artist,
          music_url: selectedMusic?.url,
        });

      if (dbError) throw dbError;

      // Stop audio preview
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      toast.success("Đã tạo story thành công");
      onStoryCreated();
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error("Không thể tạo story");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setPreview(null);
    setFile(null);
    setSelectedMusic(null);
    setShowMusicPicker(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo story</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!preview ? (
            <div
              className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Nhấp để chọn ảnh
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, JPEG tối đa 5MB
              </p>
            </div>
          ) : showMusicPicker ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Chọn nhạc</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMusicPicker(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="h-64">
                <div className="space-y-2 pr-4">
                  {musicLibrary.map((track) => (
                    <Card
                      key={track.id}
                      className={`p-3 cursor-pointer hover:bg-secondary/50 transition-colors ${
                        selectedMusic?.id === track.id ? "bg-primary/10 border-primary" : ""
                      }`}
                      onClick={() => handleMusicSelect(track)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
                          <Music className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{track.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
              <Button
                onClick={() => setShowMusicPicker(false)}
                variant="outline"
                className="w-full"
              >
                Xong
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full rounded-lg max-h-96 object-contain bg-secondary"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setPreview(null);
                    setFile(null);
                    setSelectedMusic(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Music selection */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowMusicPicker(true)}
              >
                <Music className="h-4 w-4 mr-2" />
                {selectedMusic ? `${selectedMusic.name} - ${selectedMusic.artist}` : "Thêm nhạc"}
              </Button>

              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
              >
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploading ? "Đang tải..." : "Chia sẻ story"}
              </Button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <audio ref={audioRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoryDialog;