import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, GraduationCap, Home, MapPin, Heart, Edit2, Save, X, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  work: string | null;
  education: string | null;
  lives_in: string | null;
  from_location: string | null;
  relationship: string | null;
  wallet_address: string | null;
}

interface AboutSectionProps {
  profile: Profile;
  isOwnProfile: boolean;
  onUpdate: () => void;
}

const AboutSection = ({ profile, isOwnProfile, onUpdate }: AboutSectionProps) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile.full_name || "",
    bio: profile.bio || "",
    work: profile.work || "",
    education: profile.education || "",
    lives_in: profile.lives_in || "",
    from_location: profile.from_location || "",
    relationship: profile.relationship || "",
    wallet_address: profile.wallet_address || "",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin",
      });
      setEditing(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile.full_name || "",
      bio: profile.bio || "",
      work: profile.work || "",
      education: profile.education || "",
      lives_in: profile.lives_in || "",
      from_location: profile.from_location || "",
      relationship: profile.relationship || "",
      wallet_address: profile.wallet_address || "",
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Chỉnh sửa thông tin</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Hủy
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Lưu
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Họ và tên</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Nhập họ và tên"
            />
          </div>

          <div className="space-y-2">
            <Label>Giới thiệu</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Viết vài dòng về bản thân..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Công việc</Label>
            <Input
              value={formData.work}
              onChange={(e) => setFormData({ ...formData, work: e.target.value })}
              placeholder="Vị trí công việc tại công ty"
            />
          </div>

          <div className="space-y-2">
            <Label>Học vấn</Label>
            <Input
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              placeholder="Trường học"
            />
          </div>

          <div className="space-y-2">
            <Label>Nơi ở hiện tại</Label>
            <Input
              value={formData.lives_in}
              onChange={(e) => setFormData({ ...formData, lives_in: e.target.value })}
              placeholder="Thành phố, Quốc gia"
            />
          </div>

          <div className="space-y-2">
            <Label>Quê quán</Label>
            <Input
              value={formData.from_location}
              onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
              placeholder="Thành phố, Quốc gia"
            />
          </div>

          <div className="space-y-2">
            <Label>Tình trạng</Label>
            <Input
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              placeholder="Độc thân, Đang hẹn hò, Đã kết hôn..."
            />
          </div>

          <div className="space-y-2">
            <Label>Địa chỉ ví</Label>
            <Input
              value={formData.wallet_address}
              onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
              placeholder="0x..."
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Giới thiệu</h3>
          {isOwnProfile && (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {profile.bio && (
            <p className="text-center text-muted-foreground py-2">{profile.bio}</p>
          )}

          {profile.work && (
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <span>{profile.work}</span>
            </div>
          )}

          {profile.education && (
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <span>{profile.education}</span>
            </div>
          )}

          {profile.lives_in && (
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-muted-foreground" />
              <span>Sống tại <strong>{profile.lives_in}</strong></span>
            </div>
          )}

          {profile.from_location && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span>Đến từ <strong>{profile.from_location}</strong></span>
            </div>
          )}

          {profile.relationship && (
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-muted-foreground" />
              <span>{profile.relationship}</span>
            </div>
          )}

          {profile.wallet_address && (
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <span className="font-mono text-sm truncate">{profile.wallet_address}</span>
            </div>
          )}

          {!profile.work && !profile.education && !profile.lives_in && !profile.from_location && !profile.relationship && !profile.wallet_address && !profile.bio && (
            <p className="text-center text-muted-foreground py-4">
              {isOwnProfile ? "Thêm thông tin về bản thân" : "Chưa có thông tin"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AboutSection;
