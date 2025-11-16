import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Trash2, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles: Profile;
}

interface MarketplaceItemCardProps {
  item: MarketplaceItem;
  currentUserId?: string;
  onUpdate: () => void;
}

const MarketplaceItemCard = ({ item, currentUserId, onUpdate }: MarketplaceItemCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (currentUserId !== item.user_id) return;

    try {
      const { error } = await supabase
        .from("marketplace_items")
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã xóa sản phẩm",
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} F.U Token`;
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/marketplace/${item.id}`)}
    >
      <CardContent className="p-0">
        {/* Image */}
        {item.image_url ? (
          <div className="aspect-square bg-muted">
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <p className="text-4xl">📦</p>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg line-clamp-2 mb-1">
                {item.title}
              </h3>
              <p className="text-xl font-bold text-primary">
                {formatPrice(item.price)}
              </p>
            </div>
            {currentUserId === item.user_id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {item.description}
          </p>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <MapPin className="h-4 w-4" />
            <span>{item.location}</span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={item.profiles.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {item.profiles.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {item.profiles.full_name || item.profiles.username}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.created_at), {
                addSuffix: true,
                locale: vi,
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketplaceItemCard;
