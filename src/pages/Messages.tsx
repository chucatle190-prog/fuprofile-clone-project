import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import MobileNav from "@/components/MobileNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ConversationList from "@/components/ConversationList";
import ChatWindow from "@/components/ChatWindow";

interface Conversation {
  id: string;
  name: string | null;
  type: string;
  updated_at: string;
  other_user?: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
}

const Messages = () => {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-select conversation from navigation state (works on mobile too)
  useEffect(() => {
    const passed = (location as any).state?.conversationId;
    if (passed) setSelectedConversationId(passed);
  }, [location]);

  // Realtime subscription for new messages and conversations
  useEffect(() => {
    if (!user) return;

    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Refresh conversations when new message arrives
          fetchConversations(user.id);
        }
      )
      .subscribe();

    const participantsChannel = supabase
      .channel('participants-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refresh conversations when user is added to new conversation
          fetchConversations(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [user]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchConversations(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchConversations(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchConversations = async (userId: string) => {
    // Get conversations where user is a participant
    const { data: participantData } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId);

    if (!participantData || participantData.length === 0) {
      setConversations([]);
      return;
    }

    const conversationIds = participantData.map((p) => p.conversation_id);

    // Get conversation details
    const { data: conversationsData } = await supabase
      .from("conversations")
      .select("*")
      .in("id", conversationIds)
      .order("updated_at", { ascending: false });

    if (!conversationsData) return;

    // For each conversation, get the other user and last message
    const conversationsWithDetails = await Promise.all(
      conversationsData.map(async (conv) => {
        // Get other participant
        const { data: participants } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", conv.id)
          .neq("user_id", userId);

        let otherUser = null;
        if (participants && participants.length > 0) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, full_name, avatar_url")
            .eq("id", participants[0].user_id)
            .single();

          otherUser = profile;
        }

        // Get last message
        const { data: lastMessage } = await supabase
          .from("messages")
          .select("content, created_at, sender_id")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...conv,
          other_user: otherUser,
          last_message: lastMessage,
        };
      })
    );

    setConversations(conversationsWithDetails);
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar user={user} />
      <div className="flex">
        <LeftSidebar />
        <main className="flex-1 container max-w-6xl mx-auto px-4 py-6 mb-16 md:mb-0">
          <Card className="shadow-medium h-[calc(100vh-140px)] flex overflow-hidden">
            {/* Mobile: Show either list or chat */}
            <div className={`${selectedConversationId ? 'hidden md:block' : 'block'} w-full md:w-80 border-r border-border`}>
              <ConversationList
                conversations={conversations}
                selectedId={selectedConversationId}
                onSelect={setSelectedConversationId}
                currentUserId={user?.id || ""}
              />
            </div>
            
            {/* Mobile chat view */}
            {selectedConversationId && selectedConversation && user && (
              <div className="flex-1 flex md:hidden flex-col">
                <div className="p-4 border-b border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConversationId(null)}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                  </Button>
                </div>
                <ChatWindow
                  conversationId={selectedConversationId}
                  currentUserId={user.id}
                  otherUser={selectedConversation.other_user || null}
                />
              </div>
            )}
            
            {/* Desktop chat view */}
            <div className="flex-1 hidden md:flex flex-col">
              {selectedConversationId && selectedConversation && user ? (
                <ChatWindow
                  conversationId={selectedConversationId}
                  currentUserId={user.id}
                  otherUser={selectedConversation.other_user || null}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Chọn một cuộc trò chuyện để bắt đầu
                </div>
              )}
            </div>
          </Card>
        </main>
      </div>
      <MobileNav />
    </div>
  );
};

export default Messages;