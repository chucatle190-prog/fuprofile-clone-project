import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const REACTION_EMOJIS = ["😍", "😂", "😢", "👍", "❤️"];

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
  const [reactions, setReactions] = useState<{ emoji: string; count: number }[]>([]);
  const [userReaction, setUserReaction] = useState<string | null>(null);

  useEffect(() => {
    fetchReactions();

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
        () => fetchReactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId]);

  const fetchReactions = async () => {
    const { data, error } = await supabase
      .from("message_reactions")
      .select("reaction_type, user_id")
      .eq("message_id", messageId);

    if (!error && data) {
      const grouped = data.reduce((acc: { [key: string]: number }, r) => {
        acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
        return acc;
      }, {});

      const reactionList = Object.entries(grouped).map(([emoji, count]) => ({
        emoji,
        count: count as number,
      }));

      setReactions(reactionList);

      const userReactionData = data.find((r) => r.user_id === currentUserId);
      setUserReaction(userReactionData?.reaction_type || null);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (userReaction === emoji) {
      await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", currentUserId);
      setUserReaction(null);
    } else {
      await supabase
        .from("message_reactions")
        .upsert({
          message_id: messageId,
          user_id: currentUserId,
          reaction_type: emoji,
        });
      setUserReaction(emoji);
    }
  };

  return (
    <div className={`flex gap-2 mb-4 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {!isOwn && (
        <Avatar className="h-7 w-7 mt-auto">
          <AvatarImage src={senderAvatar || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {senderName?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
        <Popover>
          <PopoverTrigger asChild>
            <div 
              className={`px-4 py-2 rounded-2xl cursor-pointer ${
                isOwn 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              }`}
            >
              <p className="text-sm break-words">{content}</p>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align={isOwn ? "end" : "start"}>
            <div className="flex gap-1">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={`text-2xl transition-transform hover:scale-125 p-1 ${
                    userReaction === emoji ? "scale-125" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        {reactions.length > 0 && (
          <div className={`flex gap-1 mt-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
            {reactions.map((r) => (
              <div
                key={r.emoji}
                className="bg-muted rounded-full px-2 py-0.5 flex items-center gap-1 text-xs"
              >
                <span>{r.emoji}</span>
                <span className="font-semibold">{r.count}</span>
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
