import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Loader2, Video, X } from "lucide-react";

interface CreatePostProps {
  onPostCreated: () => void;
}

const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = type === 'image' ? 5 : 50; // 5MB for images, 50MB for videos
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: `Kích thước ${type === 'image' ? 'ảnh' : 'video'} không được vượt quá ${maxSize}MB`,
        variant: "destructive",
      });
      return;
    }

    setMediaFile(file);
    setMediaType(type);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");

      let mediaUrl: string | null = null;

      // Upload media if exists
      if (mediaFile && mediaType) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}/post_${Date.now()}.${fileExt}`;
        const bucket = mediaType === 'image' ? 'avatars' : 'videos';

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, mediaFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        mediaUrl = data.publicUrl;
      }

      const postData: any = {
        content: content.trim(),
        user_id: user.id,
      };

      if (mediaUrl) {
        if (mediaType === 'image') {
          postData.image_url = mediaUrl;
        } else {
          postData.video_url = mediaUrl;
        }
      }

      const { error } = await supabase.from("posts").insert(postData);

      if (error) throw error;

      setContent("");
      removeMedia();
      onPostCreated();
      toast({
        title: "Thành công",
        description: "Đã đăng bài viết mới",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-soft">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Bạn đang nghĩ gì?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          
          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative rounded-lg overflow-hidden bg-secondary">
              {mediaType === 'image' ? (
                <img src={mediaPreview} alt="Preview" className="w-full max-h-96 object-contain" />
              ) : (
                <video src={mediaPreview} controls className="w-full max-h-96" />
              )}
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleMediaSelect(e, 'image')}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleMediaSelect(e, 'video')}
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => imageInputRef.current?.click()}
                disabled={!!mediaFile}
              >
                <ImagePlus className="h-5 w-5 mr-2" />
                Ảnh
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => videoInputRef.current?.click()}
                disabled={!!mediaFile}
              >
                <Video className="h-5 w-5 mr-2" />
                Video
              </Button>
            </div>
            <Button type="submit" disabled={loading || (!content.trim() && !mediaFile)}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đăng
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePost;
