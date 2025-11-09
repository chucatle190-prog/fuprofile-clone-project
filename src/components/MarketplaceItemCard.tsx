import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { MapPin, Trash2, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

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
  status: string;
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
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <Card className="overflow-hidden hover:shadow-medium transition-shadow cursor-pointer">
      <CardContent className="p-0">
        {/* Image */}
        <div className="aspect-square bg-muted relative">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Không có ảnh
            </div>
          )}
          <div className="absolute top-2 right-2">
            {currentUserId === item.user_id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa sản phẩm
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-2">{item.title}</h3>
          </div>

          <p className="text-2xl font-bold text-primary">
            {formatPrice(item.price)}
          </p>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{item.location}</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Badge variant="secondary">{item.category}</Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.created_at), {
                addSuffix: true,
                locale: vi,
              })}
            </span>
          </div>

          {/* Seller Info */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {item.profiles.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {item.profiles.full_name || item.profiles.username}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketplaceItemCard;
