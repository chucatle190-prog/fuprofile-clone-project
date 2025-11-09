import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, AlertCircle } from "lucide-react";
import { useMetaMask } from "@/hooks/useMetaMask";

const MetaMaskConnect = () => {
  const {
    account,
    balance,
    usdtBalance,
    isConnecting,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchToBSCTestnet,
  } = useMetaMask();

  if (!account) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Wallet className="h-12 w-12 text-primary" />
            <div>
              <h3 className="font-semibold mb-2">Kết nối ví MetaMask</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Kết nối ví để thanh toán bằng USDT trên BSC Testnet
              </p>
            </div>
            <Button onClick={connectWallet} disabled={isConnecting} size="lg" className="w-full">
              {isConnecting ? "Đang kết nối..." : "Kết nối MetaMask"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </p>
                <p className="text-xs text-muted-foreground">Đã kết nối</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={disconnectWallet}>
              Ngắt kết nối
            </Button>
          </div>

          {!isCorrectNetwork && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Sai mạng</p>
                <p className="text-xs text-destructive/80 mb-2">
                  Vui lòng chuyển sang BSC Testnet
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchToBSCTestnet}
                  className="h-8"
                >
                  Chuyển sang BSC Testnet
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Số dư tBNB</p>
              <p className="font-semibold">{parseFloat(balance).toFixed(4)} tBNB</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Số dư USDT</p>
              <p className="font-semibold">{parseFloat(usdtBalance).toFixed(2)} USDT</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetaMaskConnect;
