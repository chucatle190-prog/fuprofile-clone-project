import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface MessageBubbleProps {
  content: string;
  createdAt: string;
  isOwn: boolean;
  senderName?: string;
  senderAvatar?: string | null;
}

const MessageBubble = ({ content, createdAt, isOwn, senderName, senderAvatar }: MessageBubbleProps) => {
  return (
    <div className={`flex gap-2 mb-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {!isOwn && (
        <Avatar className="h-7 w-7 mt-auto">
          <AvatarImage src={senderAvatar || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {senderName?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
        <div 
          className={`px-4 py-2 rounded-2xl ${
            isOwn 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted"
          }`}
        >
          <p className="text-sm break-words">{content}</p>
        </div>
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
