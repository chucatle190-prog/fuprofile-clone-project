import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

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

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  currentUserId: string;
}

const ConversationList = ({ conversations, selectedId, onSelect, currentUserId }: ConversationListProps) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-bold mb-3">Chat</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm kiếm trên Messenger" 
            className="pl-10 bg-muted"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Chưa có cuộc trò chuyện nào
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conv) => {
              const displayName = conv.other_user?.full_name || conv.other_user?.username || conv.name || "Người dùng";
              const lastMessage = conv.last_message?.content || "Bắt đầu cuộc trò chuyện";
              const isUnread = conv.last_message?.sender_id !== currentUserId;
              
              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 hover:bg-muted transition-colors ${
                    selectedId === conv.id ? "bg-muted" : ""
                  }`}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.other_user?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="font-semibold truncate">{displayName}</div>
                    <div className={`text-sm truncate ${isUnread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {lastMessage}
                    </div>
                  </div>
                  
                  {conv.last_message && (
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.last_message.created_at), { 
                        addSuffix: false,
                        locale: vi 
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ConversationList;
