import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SHOP_CONFIG, TREASURY_ADDRESS } from "@/config/gameConfig";
import { useFUToken } from "@/hooks/useFUToken";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Sparkles } from "lucide-react";

interface ShopProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (itemKey: string) => void;
}

export default function Shop({ isOpen, onClose, onPurchase }: ShopProps) {
  const { account, fuBalance, connectWallet, addFUTokenToWallet, transferFU, isConnecting } = useFUToken();
  const { toast } = useToast();

  const handlePurchase = async (itemKey: string, price: number) => {
    if (!account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    const balance = parseFloat(fuBalance);
    if (balance < price) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${price} F.U but have ${balance.toFixed(2)} F.U`,
        variant: "destructive",
      });
      return;
    }

    try {
      const txHash = await transferFU(TREASURY_ADDRESS, price.toString());
      
      toast({
        title: "Purchase Successful! 🎉",
        description: `Transaction: ${txHash.slice(0, 10)}...`,
      });
      
      onPurchase(itemKey);
      onClose();
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            🪄 Magic Shop
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Wallet Section */}
          <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            {!account ? (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Connect wallet to purchase items</p>
                <Button onClick={connectWallet} disabled={isConnecting} className="w-full">
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect MetaMask
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Wallet Address:</span>
                  <span className="font-mono text-sm">{account.slice(0, 6)}...{account.slice(-4)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">F.U Balance:</span>
                  <span className="font-bold text-lg">{parseFloat(fuBalance).toFixed(2)} F.U</span>
                </div>
                <Button onClick={addFUTokenToWallet} variant="outline" size="sm" className="w-full">
                  Add F.U Token to MetaMask
                </Button>
              </div>
            )}
          </Card>

          {/* Shop Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(SHOP_CONFIG).map(([key, item]) => (
              <Card key={key} className="p-4 hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">{item.price} F.U</span>
                    <Button 
                      onClick={() => handlePurchase(key, item.price)}
                      disabled={!account || parseFloat(fuBalance) < item.price}
                      size="sm"
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Treasury Info */}
          <Card className="p-3 bg-muted/50">
            <p className="text-xs text-muted-foreground text-center">
              Payments go to: <span className="font-mono">{TREASURY_ADDRESS.slice(0, 10)}...{TREASURY_ADDRESS.slice(-8)}</span>
            </p>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
