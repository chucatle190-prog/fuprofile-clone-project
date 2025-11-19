import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Coins, Send } from "lucide-react";
import { toast } from "sonner";
import { useFUToken } from "@/hooks/useFUToken";

interface TransferTokenDialogProps {
  open: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string | null;
  receiverWalletAddress: string | null;
  currentBalance: number;
  onTransferSuccess: (amount: number) => void;
}

export default function TransferTokenDialog({
  open,
  onClose,
  receiverId,
  receiverName,
  receiverAvatar,
  receiverWalletAddress,
  currentBalance,
  onTransferSuccess,
}: TransferTokenDialogProps) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { account, connectWallet, transferFU } = useFUToken();

  const handleTransfer = async () => {
    const transferAmount = parseFloat(amount);

    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast.error("Vui lòng nhập số lượng hợp lệ");
      return;
    }

    if (!receiverWalletAddress) {
      toast.error("Người nhận chưa kết nối ví MetaMask");
      return;
    }

    if (!account) {
      toast.error("Vui lòng kết nối ví MetaMask");
      await connectWallet();
      return;
    }

    setLoading(true);
    try {
      console.log(`Transferring ${transferAmount} CAMLY to ${receiverWalletAddress}`);
      
      const txHash = await transferFU(receiverWalletAddress, amount);
      
      toast.success(`Đã chuyển ${transferAmount} Camly cho ${receiverName}! TX: ${txHash.slice(0, 10)}...`);
      
      setAmount("");
      setMessage("");
      onClose();
      onTransferSuccess(transferAmount);
    } catch (error: any) {
      console.error("Transfer error:", error);
      const errorMessage = error?.message || "Không thể chuyển token";
      toast.error(errorMessage);
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
            Chuyển Happy Camly
          </DialogTitle>
          <DialogDescription>
            Gửi Happy Camly on-chain qua MetaMask
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
              <p className="text-sm text-muted-foreground">
                {receiverWalletAddress ? `${receiverWalletAddress.slice(0, 6)}...${receiverWalletAddress.slice(-4)}` : "Chưa kết nối ví"}
              </p>
            </div>
          </div>

          {/* Wallet Status */}
          {!account && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm">
              <p className="text-yellow-600 dark:text-yellow-400">
                Bạn cần kết nối ví MetaMask để chuyển token on-chain
              </p>
              <Button
                onClick={connectWallet}
                className="mt-2 w-full"
                variant="outline"
              >
                Kết nối MetaMask
              </Button>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Số lượng Happy Camly</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((currentBalance * 0.25).toString())}
              >
                25%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((currentBalance * 0.5).toString())}
              >
                50%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((currentBalance * 0.75).toString())}
              >
                75%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(currentBalance.toString())}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Tin nhắn (tùy chọn)</Label>
            <Textarea
              id="message"
              placeholder="Thêm lời nhắn..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleTransfer}
              className="flex-1 gap-2"
              disabled={loading || !amount || !receiverWalletAddress || !account}
            >
              {loading ? (
                "Đang chuyển..."
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Chuyển Token
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
