import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Phone, Video, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MessageBubble from "./MessageBubble";
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
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

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

    // Subscribe to new messages
    const channel = supabase
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

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
            <p className="text-xs text-muted-foreground">Đang hoạt động</p>
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
          />
        ))}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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
