import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, MapPin } from "lucide-react";
import CreateMarketplaceItem from "@/components/marketplace/CreateMarketplaceItem";
import MarketplaceItemCard from "@/components/marketplace/MarketplaceItemCard";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const CATEGORIES = [
  "Tất cả",
  "Điện tử",
  "Thời trang",
  "Đồ gia dụng",
  "Xe cộ",
  "Bất động sản",
  "Đồ cũ",
  "Khác",
];

const Marketplace = () => {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchItems = async () => {
    try {
      const { data: itemsData, error } = await supabase
        .from("marketplace_items")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each item
      const enrichedItems: MarketplaceItem[] = [];
      if (itemsData) {
        for (const item of itemsData) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url")
            .eq("id", item.user_id)
            .single();

          if (profile) {
            enrichedItems.push({
              ...item,
              profiles: profile,
            });
          }
        }
      }

      setItems(enrichedItems);
      setFilteredItems(enrichedItems);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải sản phẩm",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel("marketplace_items")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marketplace_items",
        },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = items;

    if (selectedCategory !== "Tất cả") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query)
      );
    }

    setFilteredItems(filtered);
  }, [searchQuery, selectedCategory, items]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar user={user} />
      <div className="flex">
        <LeftSidebar />
        <main className="flex-1 container max-w-6xl mx-auto px-4 py-6 mb-16 md:mb-0">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">Marketplace</h1>
              <Button onClick={() => setShowCreate(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Đăng bán
              </Button>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm sản phẩm..."
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Đang tải...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedCategory !== "Tất cả"
                    ? "Thử thay đổi bộ lọc hoặc tìm kiếm"
                    : "Hãy là người đầu tiên đăng bán sản phẩm"}
                </p>
                {!searchQuery && selectedCategory === "Tất cả" && (
                  <Button onClick={() => setShowCreate(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Đăng bán ngay
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <MarketplaceItemCard
                  key={item.id}
                  item={item}
                  currentUserId={user?.id}
                  onUpdate={fetchItems}
                />
              ))}
            </div>
          )}
        </main>
        <RightSidebar />
      </div>
      <MobileNav />

      {showCreate && (
        <CreateMarketplaceItem
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={fetchItems}
        />
      )}
    </div>
  );
};

export default Marketplace;
