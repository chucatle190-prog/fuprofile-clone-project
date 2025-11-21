import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Phone, Video, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MessageBubble from "./MessageBubble";
import ChatFileUpload from "./ChatFileUpload";
import CallDialog from "./CallDialog";
import IncomingCallBanner from "./IncomingCallBanner";
import { PermissionDialog } from "./PermissionDialog";
import { useWebRTC } from "@/hooks/useWebRTC";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  conversation_id: string;
  deleted_at?: string | null;
  edited_at?: string | null;
  is_read?: boolean;
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  otherUser: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const ChatWindow = ({ conversationId, currentUserId, otherUser }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    callState,
    callType,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    showPermissionDialog,
    setShowPermissionDialog,
    permissionType,
  } = useWebRTC({
    conversationId,
    currentUserId,
  });

  useEffect(() => {
    fetchMessages();

    // Subscribe to messages (INSERT, UPDATE for edits/deletes)
    const messagesChannel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
          
          // Mark as read if from other user
          if (payload.new.sender_id !== currentUserId) {
            markAsRead(payload.new.id);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? payload.new as Message : msg))
          );
        }
      )
      .subscribe();

    // Subscribe to typing indicators (using presence)
    const presenceChannel = supabase.channel(`presence:${conversationId}`, {
      config: { presence: { key: currentUserId } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const otherUsers = Object.keys(state).filter(id => id !== currentUserId);
        const someoneTyping = otherUsers.some(id => {
          const userStates = state[id] as any[];
          return userStates?.some((s: any) => s?.typing === true);
        });
        setOtherUserTyping(someoneTyping);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải tin nhắn",
        variant: "destructive",
      });
      return;
    }

    setMessages(data || []);
    
    // Mark unread messages as read
    const unreadMessages = (data || []).filter(m => m.sender_id !== currentUserId && !m.is_read);
    if (unreadMessages.length > 0) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .in("id", unreadMessages.map(m => m.id));
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("id", messageId);
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      const channel = supabase.channel(`presence:${conversationId}`);
      channel.track({ typing: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const channel = supabase.channel(`presence:${conversationId}`);
      channel.track({ typing: false });
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: messageContent,
    });

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể gửi tin nhắn",
        variant: "destructive",
      });
      setNewMessage(messageContent);
    }

    setIsLoading(false);
  };

  const displayName = otherUser?.full_name || otherUser?.username || "Người dùng";

  return (
    <div className="h-full flex flex-col">
      {/* Incoming Call Banner */}
      <IncomingCallBanner
        show={callState === 'ringing'}
        callerName={displayName}
        callerAvatar={otherUser?.avatar_url}
        callType={callType}
        onAccept={acceptCall}
        onReject={rejectCall}
      />

      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{displayName}</h3>
            <p className="text-xs text-muted-foreground">
              {otherUserTyping ? "Đang gõ..." : "Đang hoạt động"}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => startCall('audio')}
            disabled={callState !== 'idle'}
          >
            <Phone className="h-5 w-5 text-primary" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => startCall('video')}
            disabled={callState !== 'idle'}
          >
            <Video className="h-5 w-5 text-primary" />
          </Button>
          <Button variant="ghost" size="icon">
            <Info className="h-5 w-5 text-primary" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            messageId={message.id}
            content={message.content}
            createdAt={message.created_at}
            isOwn={message.sender_id === currentUserId}
            currentUserId={currentUserId}
            senderName={displayName}
            senderAvatar={otherUser?.avatar_url}
            senderId={message.sender_id}
            deletedAt={message.deleted_at}
            editedAt={message.edited_at}
          />
        ))}
        {otherUserTyping && (
          <div className="flex gap-2 mb-3">
            <Avatar className="h-7 w-7">
              <AvatarImage src={otherUser?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="px-4 py-2 rounded-2xl bg-muted">
              <div className="flex gap-1">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <ChatFileUpload
            conversationId={conversationId}
            currentUserId={currentUserId}
            onUploadStart={() => setIsLoading(true)}
            onUploadComplete={() => setIsLoading(false)}
          />
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Aa"
            className="flex-1 rounded-full bg-muted"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full"
            disabled={!newMessage.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Call Dialog */}
      <CallDialog
        open={callState !== 'idle'}
        callState={callState}
        callType={callType}
        localStream={localStream}
        remoteStream={remoteStream}
        otherUser={otherUser}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={endCall}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
      />

      {/* Permission Dialog */}
      <PermissionDialog
        open={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        permissionType={permissionType}
      />
    </div>
  );
};

export default ChatWindow;
