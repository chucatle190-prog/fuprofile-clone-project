import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wallet, AlertCircle, CheckCircle } from "lucide-react";
import { useMetaMask } from "@/hooks/useMetaMask";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CryptoPaymentProps {
  itemId: string;
  itemPrice: number;
  sellerWalletAddress: string | null;
  sellerId: string;
  onPaymentSuccess: () => void;
}

const CryptoPayment = ({
  itemId,
  itemPrice,
  sellerWalletAddress,
  sellerId,
  onPaymentSuccess,
}: CryptoPaymentProps) => {
  const { account, usdtBalance, isCorrectNetwork, sendUSDT } = useMetaMask();
  const [sellerAddress, setSellerAddress] = useState(sellerWalletAddress || "");
  const [amount, setAmount] = useState(() => itemPrice.toFixed(2));
  const [isPaying, setIsPaying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!account || !isCorrectNetwork) {
      toast({
        title: "Lỗi",
        description: "Vui lòng kết nối ví MetaMask và chuyển sang BSC Testnet",
        variant: "destructive",
      });
      return;
    }

    if (!sellerAddress) {
      toast({
        title: "Lỗi",
        description: "Người bán chưa cung cấp địa chỉ ví",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Lỗi",
        description: "Số tiền không hợp lệ",
        variant: "destructive",
      });
      return;
    }

    const usdtBal = parseFloat(usdtBalance);
    if (usdtBal < amountNum) {
      toast({
        title: "Lỗi",
        description: "Số dư USDT không đủ",
        variant: "destructive",
      });
      return;
    }

    setIsPaying(true);
    setPaymentStatus("processing");

    try {
      // Send USDT transaction
      const transactionHash = await sendUSDT(sellerAddress, amount);
      setTxHash(transactionHash);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save transaction to database
      const { error: dbError } = await supabase
        .from("crypto_transactions")
        .insert({
          marketplace_item_id: itemId,
          buyer_id: user.id,
          seller_id: sellerId,
          transaction_hash: transactionHash,
          amount: amountNum,
          token_symbol: "USDT",
          network: "BSC Testnet",
          status: "confirmed",
        });

      if (dbError) throw dbError;

      setPaymentStatus("success");
      toast({
        title: "Thanh toán thành công!",
        description: `Đã chuyển ${amount} USDT`,
      });

      // Update item status to sold (optional)
      await supabase
        .from("marketplace_items")
        .update({ status: "sold" })
        .eq("id", itemId);

      onPaymentSuccess();
    } catch (error: any) {
      console.error("Payment error:", error);
      setPaymentStatus("error");
      toast({
        title: "Lỗi thanh toán",
        description: error.message || "Không thể hoàn tất giao dịch",
        variant: "destructive",
      });
    } finally {
      setIsPaying(false);
    }
  };

  if (!account) {
    return (
      <Alert>
        <Wallet className="h-4 w-4" />
        <AlertDescription>
          Vui lòng kết nối ví MetaMask để thanh toán
        </AlertDescription>
      </Alert>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Vui lòng chuyển sang BSC Testnet để thanh toán
        </AlertDescription>
      </Alert>
    );
  }

  if (paymentStatus === "success") {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900 mb-2">Thanh toán thành công!</h3>
              <p className="text-sm text-green-700 mb-4">
                Giao dịch đã được xác nhận trên blockchain
              </p>
              {txHash && (
                <a
                  href={`https://testnet.bscscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:underline break-all"
                >
                  Xem trên BscScan: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold mb-4">Thanh toán bằng USDT</h3>
          
          {!sellerWalletAddress && (
            <div className="space-y-2 mb-4">
              <Label>Địa chỉ ví người bán</Label>
              <Input
                value={sellerAddress}
                onChange={(e) => setSellerAddress(e.target.value)}
                placeholder="0x..."
              />
              <p className="text-xs text-muted-foreground">
                Người bán chưa cung cấp địa chỉ ví. Nhập địa chỉ để tiếp tục.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Số tiền (USDT)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Số dư: {parseFloat(usdtBalance).toFixed(2)} USDT
            </p>
            <p className="text-xs text-muted-foreground">
              * 1 USD = 1 USDT. Bạn có thể điều chỉnh số tiền nếu cần.
            </p>
          </div>
        </div>

        <Button
          onClick={handlePayment}
          disabled={isPaying || !sellerAddress || parseFloat(amount) <= 0}
          className="w-full"
          size="lg"
        >
          {isPaying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            `Thanh toán ${amount} USDT`
          )}
        </Button>

        {paymentStatus === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Giao dịch thất bại. Vui lòng thử lại.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default CryptoPayment;
