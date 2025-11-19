import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Coins, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TransferTokenDialogProps {
  open: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string | null;
  currentBalance: number;
  onTransferSuccess: (amount: number) => void;
}

export default function TransferTokenDialog({
  open,
  onClose,
  receiverId,
  receiverName,
  receiverAvatar,
  currentBalance,
  onTransferSuccess,
}: TransferTokenDialogProps) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTransfer = async () => {
    const transferAmount = parseFloat(amount);

    if (!transferAmount || transferAmount <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số lượng hợp lệ",
        variant: "destructive",
      });
      return;
    }

    if (transferAmount > currentBalance) {
      toast({
        title: "Số dư không đủ",
        description: `Bạn chỉ có ${currentBalance} F.U Token`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Lỗi xác thực",
          description: "Vui lòng đăng nhập lại",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('transfer-tokens', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          receiver_id: receiverId,
          amount: transferAmount,
          message: message || null,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Chuyển thành công! 🎉",
          description: data.message,
        });

        onTransferSuccess(transferAmount);
        onClose();
        setAmount("");
        setMessage("");
      } else {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      toast({
        title: "Lỗi chuyển token",
        description: error.message || "Không thể chuyển F.U Token",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-accent" />
            Chuyển F.U Token
          </DialogTitle>
          <DialogDescription>
            Gửi F.U Token cho bạn bè của bạn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Receiver Info */}
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
            <Avatar>
              <AvatarImage src={receiverAvatar || undefined} />
              <AvatarFallback>{receiverName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{receiverName}</p>
              <p className="text-sm text-muted-foreground">Người nhận</p>
            </div>
          </div>

          {/* Current Balance */}
          <div className="bg-accent/10 p-3 rounded-lg border border-accent/20">
            <p className="text-sm text-muted-foreground mb-1">Số dư hiện tại</p>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-accent" />
              <span className="text-2xl font-bold text-accent">
                {currentBalance.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">F.U Token</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Số lượng F.U Token</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount((currentBalance * 0.25).toString())}
              >
                25%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount((currentBalance * 0.5).toString())}
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount((currentBalance * 0.75).toString())}
              >
                75%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount(currentBalance.toString())}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="message">Tin nhắn (tùy chọn)</Label>
            <Textarea
              id="message"
              placeholder="Thêm lời nhắn cho bạn..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/200
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={loading || !amount}
              className="flex-1 gap-2"
            >
              {loading ? (
                "Đang gửi..."
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Gửi Token
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
