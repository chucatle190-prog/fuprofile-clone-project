import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, MessageCircle, Trash2, AlertCircle, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import MetaMaskConnect from "@/components/crypto/MetaMaskConnect";
import CryptoPayment from "@/components/crypto/CryptoPayment";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
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

const MarketplaceItemDetail = () => {
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (id) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    try {
      const { data: itemData, error } = await supabase
        .from("marketplace_items")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (itemData) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, wallet_address")
          .eq("id", itemData.user_id)
          .single();

        if (profile) {
          setItem({
            ...itemData,
            profiles: profile,
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải sản phẩm",
        variant: "destructive",
      });
      navigate("/marketplace");
    } finally {
      setLoading(false);
    }
  };

  const handleContactSeller = async () => {
    if (!user || !item) return;

    try {
      // Check if conversation already exists
      const { data: existingConversations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      let conversationId = null;

      if (existingConversations) {
        for (const conv of existingConversations) {
          const { data: participants } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conv.conversation_id);

          if (
            participants &&
            participants.length === 2 &&
            participants.some((p) => p.user_id === item.user_id)
          ) {
            conversationId = conv.conversation_id;
            break;
          }
        }
      }

      // Create new conversation if doesn't exist
      if (!conversationId) {
        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert({
            type: "direct",
          })
          .select()
          .single();

        if (convError) throw convError;

        conversationId = newConv.id;

        // Add participants
        const { error: participantsError } = await supabase
          .from("conversation_participants")
          .insert([
            { conversation_id: conversationId, user_id: user.id },
            { conversation_id: conversationId, user_id: item.user_id },
          ]);

        if (participantsError) throw participantsError;
      }

      navigate("/messages", { state: { 
        conversationId,
        otherUser: {
          username: item.profiles.username,
          full_name: item.profiles.full_name,
          avatar_url: item.profiles.avatar_url,
        }
      } });
      
      toast({
        title: "Thành công",
        description: "Đã mở tin nhắn với người bán",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!user || !item || user.id !== item.user_id) return;

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
      navigate("/marketplace");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Không tìm thấy sản phẩm</h3>
            <Button onClick={() => navigate("/marketplace")} className="mt-4">
              Quay lại Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar user={user} />
      <div className="flex">
        <LeftSidebar />
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-6 mb-16 md:mb-0">
          <Button
            variant="ghost"
            onClick={() => navigate("/marketplace")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Image */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full aspect-square object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <p className="text-6xl">📦</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Details */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h1 className="text-2xl font-bold mb-2">{item.title}</h1>
                  <p className="text-3xl font-bold text-primary mb-4">
                    {formatPrice(item.price)}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{item.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm bg-secondary px-3 py-1 rounded-full">
                        {item.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold mb-2">Mô tả</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap mb-6">
                    {item.description}
                  </p>

                  {user?.id !== item.user_id ? (
                    <Tabs defaultValue="message" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="message">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Nhắn tin
                        </TabsTrigger>
                        <TabsTrigger value="crypto">
                          <Wallet className="h-4 w-4 mr-2" />
                          Thanh toán Crypto
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="message" className="mt-4">
                        <Button
                          onClick={handleContactSeller}
                          className="w-full gap-2"
                          size="lg"
                        >
                          <MessageCircle className="h-5 w-5" />
                          Nhắn tin người bán
                        </Button>
                      </TabsContent>

                      <TabsContent value="crypto" className="mt-4 space-y-4">
                        <MetaMaskConnect />
                        <CryptoPayment
                          itemId={item.id}
                          itemPrice={item.price}
                          sellerWalletAddress={item.profiles.wallet_address}
                          sellerId={item.user_id}
                          onPaymentSuccess={() => {
                            fetchItem();
                          }}
                        />
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <Button
                      onClick={handleDelete}
                      variant="destructive"
                      className="w-full gap-2"
                      size="lg"
                    >
                      <Trash2 className="h-5 w-5" />
                      Xóa sản phẩm
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Seller Info */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Thông tin người bán</h3>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={item.profiles.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {item.profiles.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">
                        {item.profiles.full_name || item.profiles.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{item.profiles.username}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <RightSidebar />
      </div>
      <MobileNav />
    </div>
  );
};

export default MarketplaceItemDetail;
