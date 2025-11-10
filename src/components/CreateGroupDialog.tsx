import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onGroupCreated: () => void;
}

const CreateGroupDialog = ({ open, onOpenChange, userId, onGroupCreated }: CreateGroupDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên nhóm");
      return;
    }

    setUploading(true);
    try {
      let coverUrl = null;

      // Upload cover image if provided
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop();
        const fileName = `${userId}/group_cover_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('covers')
          .upload(fileName, coverImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('covers')
          .getPublicUrl(fileName);

        coverUrl = publicUrl;
      }

      // Create group
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          cover_url: coverUrl,
          created_by: userId,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: userId,
          role: "admin",
        });

      if (memberError) throw memberError;

      toast.success("Đã tạo nhóm thành công");
      setName("");
      setDescription("");
      setCoverImage(null);
      onOpenChange(false);
      onGroupCreated();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Không thể tạo nhóm");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo nhóm mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tên nhóm *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên nhóm..."
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả về nhóm..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="cover">Ảnh bìa</Label>
            <div className="mt-2">
              <label
                htmlFor="cover-upload"
                className="flex items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
              >
                {coverImage ? (
                  <img
                    src={URL.createObjectURL(coverImage)}
                    alt="Cover preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <span className="text-sm">Chọn ảnh bìa</span>
                  </div>
                )}
              </label>
              <input
                id="cover-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setCoverImage(file);
                }}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={uploading || !name.trim()}>
              {uploading ? "Đang tạo..." : "Tạo nhóm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
