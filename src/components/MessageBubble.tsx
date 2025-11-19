import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Smile } from "lucide-react";
import TopOneBadge from "./TopOneBadge";

const REACTIONS = ["❤️", "😂", "😢", "😍", "👍"];

interface MessageBubbleProps {
  messageId: string;
  content: string;
  createdAt: string;
  isOwn: boolean;
  currentUserId: string;
  senderName?: string;
  senderAvatar?: string | null;
}

const MessageBubble = ({ messageId, content, createdAt, isOwn, currentUserId, senderName, senderAvatar }: MessageBubbleProps) => {
  const [reactions, setReactions] = useState<{ [key: string]: number }>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);

  useEffect(() => {
    fetchReactions();

    // Subscribe to reaction changes
    const channel = supabase
      .channel(`message_reactions:${messageId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
          filter: `message_id=eq.${messageId}`,
        },
        () => {
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId]);

  const fetchReactions = async () => {
    const { data } = await supabase
      .from("message_reactions")
      .select("reaction_type, user_id")
      .eq("message_id", messageId);

    if (data) {
      const reactionCounts: { [key: string]: number } = {};
      let myReaction: string | null = null;

      data.forEach((r) => {
        reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
        if (r.user_id === currentUserId) {
          myReaction = r.reaction_type;
        }
      });

      setReactions(reactionCounts);
      setUserReaction(myReaction);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (userReaction === emoji) {
      // Remove reaction
      await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", currentUserId);
    } else {
      // Add or update reaction
      await supabase
        .from("message_reactions")
        .upsert({
          message_id: messageId,
          user_id: currentUserId,
          reaction_type: emoji,
        });

      // Create notification if reacting to someone else's message
      const { data: message } = await supabase
        .from("messages")
        .select("sender_id")
        .eq("id", messageId)
        .single();

      if (message && message.sender_id !== currentUserId) {
        await supabase
          .from("notifications")
          .insert({
            user_id: message.sender_id,
            type: "message_reaction",
            content: `${emoji} đã thả reaction vào tin nhắn của bạn`,
            related_id: messageId,
          });
      }
    }
  };

  return (
    <div className={`flex gap-2 mb-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {!isOwn && (
        <div className="flex flex-col items-center gap-1">
          <Avatar className="h-7 w-7">
            <AvatarImage src={senderAvatar || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {senderName?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {currentUserId && (
            <TopOneBadge userId={currentUserId} size="sm" />
          )}
        </div>
      )}
      
      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
        <div className="relative group">
          <div 
            className={`px-4 py-2 rounded-2xl ${
              isOwn 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted"
            }`}
          >
            <p className="text-sm break-words">{content}</p>
          </div>
          
          {/* Reaction button - show on hover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`absolute -bottom-2 ${isOwn ? "left-0" : "right-0"} h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded-full`}
              >
                <Smile className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align={isOwn ? "start" : "end"}>
              <div className="flex gap-1">
                {REACTIONS.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="icon"
                    className={`text-xl hover:scale-125 transition-transform ${
                      userReaction === emoji ? "bg-accent" : ""
                    }`}
                    onClick={() => handleReaction(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Display reactions */}
        {Object.entries(reactions).filter(([_, count]) => count > 0).length > 0 && (
          <div className={`flex gap-1 mt-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
            {Object.entries(reactions).filter(([_, count]) => count > 0).map(([emoji, count]) => (
              <div 
                key={emoji} 
                className="bg-muted rounded-full px-2 py-0.5 flex items-center gap-1 border border-border"
              >
                <span className="text-sm">{emoji}</span>
                <span className="text-xs text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        )}

        <span className="text-xs text-muted-foreground mt-1 px-2">
          {formatDistanceToNow(new Date(createdAt), { 
            addSuffix: true,
            locale: vi 
          })}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;