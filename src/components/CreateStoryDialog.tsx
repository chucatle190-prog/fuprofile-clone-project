import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Create story in database
      const { error: dbError } = await supabase
        .from('stories')
        .insert({
          user_id: userId,
          image_url: data.publicUrl,
        });

      if (dbError) throw dbError;

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
          ) : (
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
                }}
              >
                <X className="h-4 w-4" />
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
          {preview && (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
            >
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? "Đang tải..." : "Chia sẻ story"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoryDialog;