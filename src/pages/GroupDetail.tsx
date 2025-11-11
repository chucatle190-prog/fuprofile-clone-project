import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageSquare, Gamepad2, ArrowLeft, Trophy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import SpinWheel from "@/components/games/SpinWheel";
import WordPuzzle from "@/components/games/WordPuzzle";
import GameLeaderboard from "@/components/games/GameLeaderboard";
import QuizForSpins from "@/components/games/QuizForSpins";
import MemoryMatch from "@/components/games/MemoryMatch";
import { PrincessRescue } from "@/components/games/PrincessRescue";
import UserLevel from "@/components/profile/UserLevel";
import UserBadges from "@/components/profile/UserBadges";
import DailyTasks from "@/components/profile/DailyTasks";
import RewardHistory from "@/components/profile/RewardHistory";
import GroupMembers from "@/components/GroupMembers";
import { useDailyTaskTracker } from "@/hooks/useDailyTaskTracker";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Edit2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import GroupRewards from "@/components/groups/GroupRewards";

interface Group {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_by: string;
}

interface UserRole {
  role: string;
}

const GroupDetail = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto track daily tasks
  useDailyTaskTracker(user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (groupId && user) {
      fetchGroup();
      fetchMessages();
      fetchUserRole();
    }
  }, [groupId, user]);

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group_posts_${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_posts",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchGroup = async () => {
    if (!groupId) return;

    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (error) throw error;
      setGroup(data);
    } catch (error) {
      console.error("Error fetching group:", error);
      toast.error("Không thể tải thông tin nhóm");
      navigate("/groups");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRole = async () => {
    if (!groupId || !user) return;

    try {
      const { data, error } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      if (data) setUserRole(data.role);
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchMessages = async () => {
    if (!groupId) return;

    const { data: posts } = await supabase
      .from("group_posts")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (posts) {
      const userIds = Array.from(new Set(posts.map((m: any) => m.user_id)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const enriched = posts.map((m: any) => ({
        ...m,
        profiles: profileMap.get(m.user_id) || {
          username: "Unknown",
          full_name: null,
          avatar_url: null,
        },
      }));

      setMessages(enriched);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !groupId) return;

    try {
      const { error } = await supabase.from("group_posts").insert({
        group_id: groupId,
        user_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Không thể gửi tin nhắn");
    }
  };

  const startEdit = (message: any) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  const saveEdit = async () => {
    if (!editContent.trim() || !editingMessage) return;

    try {
      const { error } = await supabase
        .from("group_posts")
        .update({
          content: editContent.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingMessage);

      if (error) throw error;
      setEditingMessage(null);
      setEditContent("");
      toast.success("Đã cập nhật tin nhắn");
    } catch (error) {
      console.error("Error editing message:", error);
      toast.error("Không thể sửa tin nhắn");
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("group_posts")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
      toast.success("Đã xóa tin nhắn");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Không thể xóa tin nhắn");
    }
  };

  const deleteGroup = async () => {
    if (!groupId || !user || !group) return;
    
    if (group.created_by !== user.id) {
      toast.error("Chỉ chủ nhóm mới có thể xóa nhóm");
      return;
    }

    if (!confirm("Bạn có chắc chắn muốn xóa nhóm này? Hành động này không thể hoàn tác.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId);

      if (error) throw error;
      toast.success("Đã xóa nhóm thành công");
      navigate("/groups");
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Không thể xóa nhóm");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar user={user} />
      <div className="flex">
        <LeftSidebar />
        <main className="flex-1 container max-w-6xl mx-auto px-4 py-6 mb-16 md:mb-0">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/groups")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
              
              {user && group && group.created_by === user.id && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteGroup}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa nhóm
                </Button>
              )}
            </div>

            <Card>
              <CardContent className="p-6">
                {group.cover_url && (
                  <img
                    src={group.cover_url}
                    alt={group.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
                {group.description && (
                  <p className="text-muted-foreground">{group.description}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="chat" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="games">
                <Gamepad2 className="h-4 w-4 mr-2" />
                Games
              </TabsTrigger>
              <TabsTrigger value="profile">
                <Users className="h-4 w-4 mr-2" />
                Hồ sơ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Trò chuyện</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Messages */}
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4 mb-4">
                      {messages.map((message) => {
                        const isOwn = message.user_id === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${
                              isOwn ? "flex-row-reverse" : "flex-row"
                            }`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={message.profiles.avatar_url || ""}
                              />
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {message.profiles.username[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div
                              className={`flex-1 max-w-[70%] ${
                                isOwn ? "items-end" : "items-start"
                              } flex flex-col`}
                            >
                              {editingMessage === message.id ? (
                                <div className="w-full space-y-2">
                                  <Input
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveEdit();
                                      if (e.key === "Escape")
                                        setEditingMessage(null);
                                    }}
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={saveEdit}>
                                      Lưu
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingMessage(null)}
                                    >
                                      Hủy
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`px-4 py-2 rounded-2xl group relative ${
                                    isOwn
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  }`}
                                >
                                  <p className="text-sm break-words">
                                    {message.content}
                                  </p>
                                  {message.updated_at !== message.created_at && (
                                    <span className="text-xs opacity-70">
                                      {" "}
                                      (đã chỉnh sửa)
                                    </span>
                                  )}

                                  {(isOwn || userRole === 'admin' || userRole === 'moderator') && (
                                    <div className="absolute -right-20 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                      {isOwn && (
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7"
                                          onClick={() => startEdit(message)}
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={() => deleteMessage(message.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="flex gap-2 mt-4">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") sendMessage();
                      }}
                      placeholder="Nhập tin nhắn..."
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="games" className="space-y-4">
              {/* Rewards Section */}
              {user && groupId && (
                <GroupRewards userId={user.id} groupId={groupId} />
              )}

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">🎮 Mini Games</h2>
                <div className="flex gap-2">
                  <Button
                    variant={showQuiz ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setShowQuiz(!showQuiz);
                      setShowLeaderboard(false);
                    }}
                  >
                    {showQuiz ? "Ẩn Quiz" : "Quiz nhận lượt"}
                  </Button>
                  <Button
                    variant={showLeaderboard ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setShowLeaderboard(!showLeaderboard);
                      setShowQuiz(false);
                    }}
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    {showLeaderboard ? "Chơi game" : "Bảng xếp hạng"}
                  </Button>
                </div>
              </div>

              {showQuiz ? (
                <QuizForSpins
                  groupId={groupId!}
                  userId={user?.id || ""}
                  onComplete={() => {
                    setShowQuiz(false);
                    window.location.reload();
                  }}
                />
              ) : showLeaderboard ? (
                <Tabs defaultValue="spin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="spin">Vòng Quay</TabsTrigger>
                    <TabsTrigger value="puzzle">Ghép Chữ</TabsTrigger>
                    <TabsTrigger value="memory">Ghép Hình</TabsTrigger>
                    <TabsTrigger value="rescue">Giải Cứu</TabsTrigger>
                  </TabsList>
                  <TabsContent value="spin">
                    <GameLeaderboard groupId={groupId!} gameType="spin_wheel" />
                  </TabsContent>
                  <TabsContent value="puzzle">
                    <GameLeaderboard groupId={groupId!} gameType="word_puzzle" />
                  </TabsContent>
                  <TabsContent value="memory">
                    <GameLeaderboard groupId={groupId!} gameType="memory_match" />
                  </TabsContent>
                  <TabsContent value="rescue">
                    <GameLeaderboard groupId={groupId!} gameType="princess_rescue" />
                  </TabsContent>
                </Tabs>
              ) : (
                <Tabs defaultValue="spin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="spin">Vòng Quay</TabsTrigger>
                    <TabsTrigger value="puzzle">Ghép Chữ</TabsTrigger>
                    <TabsTrigger value="memory">Ghép Hình</TabsTrigger>
                    <TabsTrigger value="rescue">Giải Cứu</TabsTrigger>
                  </TabsList>
                  <TabsContent value="spin">
                    <SpinWheel groupId={groupId!} />
                  </TabsContent>
                  <TabsContent value="puzzle">
                    <WordPuzzle groupId={groupId!} />
                  </TabsContent>
                  <TabsContent value="memory">
                    <MemoryMatch groupId={groupId!} />
                  </TabsContent>
                  <TabsContent value="rescue">
                    <PrincessRescue groupId={groupId!} userId={user?.id} />
                  </TabsContent>
                </Tabs>
              )}
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
              {user && groupId && (
                <>
                  <GroupMembers 
                    groupId={groupId} 
                    currentUserId={user.id}
                    userRole={userRole}
                  />
                  <DailyTasks userId={user.id} />
                  <RewardHistory userId={user.id} />
                  <UserLevel userId={user.id} />
                  <UserBadges userId={user.id} />
                </>
              )}
            </TabsContent>
          </Tabs>
        </main>
        <RightSidebar />
      </div>
      <MobileNav user={user} />
    </div>
  );
};

export default GroupDetail;
