import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, Coins } from "lucide-react";
import AvatarViewer from "@/components/AvatarViewer";
import TransferTokenDialog from "@/components/TransferTokenDialog";

interface Friend {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
}

interface FriendsListProps {
  userId: string;
}

const FriendsList = ({ userId }: FriendsListProps) => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAvatarViewer, setShowAvatarViewer] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<{ url: string | null; username: string; fullName: string | null } | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    fetchFriends();
    fetchBalance();
  }, [userId]);

  const fetchBalance = async () => {
    const { data: wallet } = await supabase
      .from("user_wallets")
      .select("camly_balance")
      .eq("user_id", userId)
      .single();
    
    if (wallet) {
      setCurrentBalance(Number(wallet.camly_balance));
    }
  };

  const fetchFriends = async () => {
    // Get friends where I'm user_id
    const { data: friends1 } = await supabase
      .from("friendships")
      .select(`
        profiles!friendships_friend_id_fkey(
          id, 
          username, 
          full_name, 
          avatar_url, 
          wallet_address
        )
      `)
      .eq("user_id", userId)
      .eq("status", "accepted")
      .limit(9);

    // Get friends where I'm friend_id
    const { data: friends2 } = await supabase
      .from("friendships")
      .select(`
        profiles!friendships_user_id_fkey(
          id, 
          username, 
          full_name, 
          avatar_url, 
          wallet_address
        )
      `)
      .eq("friend_id", userId)
      .eq("status", "accepted")
      .limit(9);

    const allFriends = [
      ...(friends1 || []).map((f: any) => f.profiles),
      ...(friends2 || []).map((f: any) => f.profiles),
    ].filter(Boolean) as Friend[];

    setFriends(allFriends.slice(0, 9));
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Đang tải...</p>
      </Card>
    );
  }

  if (friends.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Chưa có bạn bè</p>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {friends.map((friend) => (
          <Card 
            key={friend.id} 
            className="p-4 text-center hover:bg-accent/10 transition-colors relative group"
          >
            <Avatar 
              className="h-20 w-20 mx-auto mb-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAvatar({
                  url: friend.avatar_url,
                  username: friend.username,
                  fullName: friend.full_name
                });
                setShowAvatarViewer(true);
              }}
            >
              <AvatarImage src={friend.avatar_url || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {friend.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p 
              className="font-medium text-sm truncate cursor-pointer hover:underline mb-2"
              onClick={() => navigate(`/profile/${friend.username}`)}
            >
              {friend.full_name || friend.username}
            </p>
            {friend.wallet_address && (
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  setSelectedFriend(friend);
                  setShowTransferDialog(true);
                }}
              >
                <Coins className="h-3 w-3" />
                Chuyển Token
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* Avatar Viewer */}
      {selectedAvatar && (
        <AvatarViewer
          open={showAvatarViewer}
          onOpenChange={setShowAvatarViewer}
          avatarUrl={selectedAvatar.url}
          username={selectedAvatar.username}
          fullName={selectedAvatar.fullName}
        />
      )}

      {/* Transfer Token Dialog */}
      {selectedFriend && (
        <TransferTokenDialog
          open={showTransferDialog}
          onClose={() => {
            setShowTransferDialog(false);
            setSelectedFriend(null);
          }}
          receiverId={selectedFriend.id}
          receiverName={selectedFriend.full_name || selectedFriend.username}
          receiverAvatar={selectedFriend.avatar_url}
          receiverWalletAddress={selectedFriend.wallet_address}
          currentBalance={currentBalance}
          onTransferSuccess={() => {
            fetchBalance();
          }}
        />
      )}
    </>
  );
};

export default FriendsList;
