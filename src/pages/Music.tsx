import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music as MusicIcon, Play, Pause } from "lucide-react";

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
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Play className="h-5 w-5 text-primary" />
                      Playlist Chính Thức
                    </h3>
                    <a 
                      href={playlistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-2"
                    >
                      Mở trên Suno →
                    </a>
                  </div>

                  {/* Suno Playlist Embed */}
                  <div className="w-full rounded-lg overflow-hidden shadow-xl border border-border bg-card">
                    <iframe
                      src={`${playlistUrl}?embed=true`}
                      width="100%"
                      height="600"
                      className="w-full"
                      style={{ border: 'none' }}
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                      loading="lazy"
                      title="Suno Playlist"
                    />
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
                          <Pause className="h-5 w-5 text-accent-foreground" />
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
