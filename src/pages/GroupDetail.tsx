import { useEffect, useState } from "react";
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
import { Users, MessageSquare, Gamepad2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import SpinWheel from "@/components/games/SpinWheel";
import WordPuzzle from "@/components/games/WordPuzzle";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Edit2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Group {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

const GroupDetail = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deletingMessage, setDeletingMessage] = useState<string | null>(null);

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
    if (groupId) {
      fetchGroup();
      fetchMessages();
    }
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group_${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
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

  const fetchMessages = async () => {
    if (!groupId) return;

    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", groupId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (messages) {
      const userIds = Array.from(new Set(messages.map((m: any) => m.sender_id)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const enriched = messages.map((m: any) => ({
        ...m,
        profiles: profileMap.get(m.sender_id) || {
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
      const { error } = await supabase.from("messages").insert({
        conversation_id: groupId,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Không thể gửi tin nhắn");
    }
  };

  const startEdit = (message: Message) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  const saveEdit = async () => {
    if (!editContent.trim() || !editingMessage) return;

    try {
      const { error } = await supabase
        .from("messages")
        .update({
          content: editContent.trim(),
          edited_at: new Date().toISOString(),
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
        .from("messages")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", messageId);

      if (error) throw error;
      setDeletingMessage(null);
      toast.success("Đã xóa tin nhắn");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Không thể xóa tin nhắn");
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
            <Button
              variant="ghost"
              onClick={() => navigate("/groups")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>

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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat nhóm
              </TabsTrigger>
              <TabsTrigger value="games">
                <Gamepad2 className="h-4 w-4 mr-2" />
                Mini Games
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Trò chuyện</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Messages */}
                  <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto">
                    {messages.map((message) => {
                      const isOwn = message.sender_id === user?.id;
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
                                {message.edited_at && (
                                  <span className="text-xs opacity-70">
                                    {" "}
                                    (đã chỉnh sửa)
                                  </span>
                                )}

                                {isOwn && (
                                  <div className="absolute -right-20 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => startEdit(message)}
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() =>
                                        setDeletingMessage(message.id)
                                      }
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
                  </div>

                  {/* Input */}
                  <div className="flex gap-2">
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
              <SpinWheel />
              <WordPuzzle />
            </TabsContent>
          </Tabs>
        </main>
        <RightSidebar />
      </div>
      <MobileNav user={user} />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingMessage}
        onOpenChange={() => setDeletingMessage(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tin nhắn?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa tin nhắn này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingMessage && deleteMessage(deletingMessage)}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GroupDetail;
