import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

interface Photo {
  id: string;
  image_url: string;
  created_at: string;
}

interface PhotosGridProps {
  userId: string;
}

const PhotosGrid = ({ userId }: PhotosGridProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, [userId]);

  const fetchPhotos = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, image_url, created_at")
      .eq("user_id", userId)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(9);

    if (data) {
      setPhotos(data.filter(p => p.image_url) as Photo[]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Đang tải...</p>
      </Card>
    );
  }

  if (photos.length === 0) {
    return (
      <Card className="p-8 text-center">
        <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Chưa có ảnh nào</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
        >
          <img
            src={photo.image_url}
            alt="Photo"
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
};

export default PhotosGrid;
