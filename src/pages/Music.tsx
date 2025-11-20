import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music as MusicIcon, Play, ExternalLink, RefreshCw } from "lucide-react";

const Music = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const playlistUrl = "https://suno.com/playlist/780671e0-02c4-467d-8ddb-b6e9a2ede0f5";

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          <LeftSidebar />

          <main className="flex-1 max-w-4xl mx-auto space-y-6">
            <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <MusicIcon className="h-16 w-16 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  🎵 Nghe Nhạc Happy Camly
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  Thư viện nhạc độc quyền của cộng đồng Happy Camly
                </p>
              </CardHeader>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="text-center space-y-4">
                    <div className="relative w-full max-w-md mx-auto aspect-square rounded-lg overflow-hidden shadow-2xl border-2 border-primary/20">
                      <img 
                        src="https://cdn2.suno.ai/674cb425.jpeg?width=600" 
                        alt="8 câu Thần Chú Playlist"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 className="text-2xl font-bold mb-2">8 câu Thần Chú</h3>
                        <p className="text-sm opacity-90">28 bài hát</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      <Button
                        onClick={() => window.open(playlistUrl, '_blank')}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
                      >
                        <Play className="h-6 w-6" />
                        Nghe trên Suno
                        <ExternalLink className="h-5 w-5" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Làm mới
                      </Button>
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-sm text-muted-foreground">
                        💡 <strong>Lưu ý:</strong> Playlist này được lưu trữ trên Suno và tự động cập nhật khi có bài hát mới. 
                        Nhấn "Nghe trên Suno" để truy cập playlist đầy đủ với tất cả tính năng phát nhạc.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-full">
                          <MusicIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Playlist</p>
                          <p className="text-lg font-bold">Happy Camly</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary/20 rounded-full">
                          <Play className="h-5 w-5 text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tự động</p>
                          <p className="text-lg font-bold">Cập nhật</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/20 rounded-full">
                          <MusicIcon className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Chất lượng</p>
                          <p className="text-lg font-bold">Cao</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground text-center">
                      💡 <strong>Lưu ý:</strong> Playlist này tự động cập nhật khi có bài hát mới được thêm vào. 
                      Làm mới trang để xem nội dung mới nhất.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>

          <div className="hidden lg:block">
            <RightSidebar />
          </div>
        </div>
      </div>

      <MobileNav user={user} />
    </div>
  );
};

export default Music;
