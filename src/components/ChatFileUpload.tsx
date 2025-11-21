import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Image, Video, File, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatFileUploadProps {
  conversationId: string;
  currentUserId: string;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
}

const ChatFileUpload = ({ conversationId, currentUserId, onUploadStart, onUploadComplete }: ChatFileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ type: string; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video" | "file") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Lỗi",
        description: "File quá lớn. Tối đa 50MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    onUploadStart?.();

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const bucket = type === "image" ? "avatars" : type === "video" ? "videos" : "avatars";
      
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      // Create message with file
      const content = type === "file" ? `📎 ${file.name}` : publicUrl;
      
      const { error: messageError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content,
      });

      if (messageError) throw messageError;

      toast({
        title: "Thành công",
        description: "Đã gửi file",
      });

      setPreview(null);
      onUploadComplete?.();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileSelect(e, "file")}
        accept="image/*,video/*,application/*"
      />
      
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            disabled={uploading}
            className="rounded-full"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              className="justify-start gap-2"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e: any) => handleFileSelect(e, "image");
                input.click();
              }}
              disabled={uploading}
            >
              <div className="bg-blue-500 text-white p-2 rounded-full">
                <Image className="h-4 w-4" />
              </div>
              Hình ảnh
            </Button>
            
            <Button
              variant="ghost"
              className="justify-start gap-2"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "video/*";
                input.onchange = (e: any) => handleFileSelect(e, "video");
                input.click();
              }}
              disabled={uploading}
            >
              <div className="bg-green-500 text-white p-2 rounded-full">
                <Video className="h-4 w-4" />
              </div>
              Video
            </Button>
            
            <Button
              variant="ghost"
              className="justify-start gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <div className="bg-purple-500 text-white p-2 rounded-full">
                <File className="h-4 w-4" />
              </div>
              File
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {preview && (
        <div className="absolute bottom-16 left-4 right-4 bg-background border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Xem trước</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPreview(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {preview.type === "image" && (
            <img src={preview.url} alt="Preview" className="max-h-48 rounded" />
          )}
          {preview.type === "video" && (
            <video src={preview.url} className="max-h-48 rounded" controls />
          )}
        </div>
      )}
    </>
  );
};

export default ChatFileUpload;
