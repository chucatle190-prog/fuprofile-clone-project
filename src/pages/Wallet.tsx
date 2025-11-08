import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wallet as WalletIcon, Send, Download, Gift, Copy, QrCode } from "lucide-react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletData {
  wallet_address: string | null;
  bnb_balance: number;
  usdt_balance: number;
  camly_balance: number;
  btc_balance: number;
  total_usd: number;
  total_reward_camly: number;
}

const BSC_TESTNET = {
  chainId: "0x61",
  chainName: "BSC Testnet",
  rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
  nativeCurrency: {
    name: "tBNB",
    symbol: "tBNB",
    decimals: 18,
  },
  blockExplorerUrls: ["https://testnet.bscscan.com/"],
};

const CAMLY_TOKEN_ADDRESS = "0x0910320181889feFDE0BB1Ca63962b0A8882e413";

const Wallet = () => {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchWallet(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchWallet(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchWallet = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setWallet(data);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin ví",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      toast({
        title: "Lỗi",
        description: "Vui lòng cài đặt MetaMask",
        variant: "destructive",
      });
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [BSC_TESTNET],
      });

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const walletAddress = accounts[0];

      await supabase
        .from("user_wallets")
        .update({ wallet_address: walletAddress })
        .eq("user_id", user?.id);

      setWallet({ ...wallet!, wallet_address: walletAddress });

      toast({
        title: "Thành công",
        description: "Đã kết nối ví MetaMask",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyAddress = () => {
    if (wallet?.wallet_address) {
      navigator.clipboard.writeText(wallet.wallet_address);
      toast({
        title: "Đã sao chép",
        description: "Địa chỉ ví đã được sao chép",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar user={user} />
      <div className="flex">
        <LeftSidebar />
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-6 mb-16 md:mb-0">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WalletIcon className="h-6 w-6 text-primary" />
                Ví của tôi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!wallet?.wallet_address ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Chưa kết nối ví</p>
                  <Button onClick={connectWallet}>
                    <WalletIcon className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </Button>
                </div>
              ) : (
                <>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <Label className="text-sm text-muted-foreground">Địa chỉ ví</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="flex-1 text-sm bg-background px-3 py-2 rounded">
                        {wallet.wallet_address}
                      </code>
                      <Button size="sm" variant="ghost" onClick={copyAddress}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/10 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Tổng USD</p>
                      <p className="text-2xl font-bold text-primary">${wallet.total_usd}</p>
                    </div>
                    <div className="bg-accent/10 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Total Reward</p>
                      <p className="text-2xl font-bold text-accent">{wallet.total_reward_camly} CAMLY</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                      <span className="font-medium">BNB</span>
                      <span className="font-semibold">{wallet.bnb_balance}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                      <span className="font-medium">USDT</span>
                      <span className="font-semibold">{wallet.usdt_balance}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                      <span className="font-medium">CAMLY</span>
                      <span className="font-semibold">{wallet.camly_balance}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                      <span className="font-medium">BTC</span>
                      <span className="font-semibold">{wallet.btc_balance}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Button variant="outline" className="flex-col h-auto py-4">
                      <Send className="h-5 w-5 mb-2" />
                      <span>Send</span>
                    </Button>
                    <Button variant="outline" className="flex-col h-auto py-4">
                      <Download className="h-5 w-5 mb-2" />
                      <span>Receive</span>
                    </Button>
                    <Button variant="outline" className="flex-col h-auto py-4">
                      <Gift className="h-5 w-5 mb-2" />
                      <span>Claim</span>
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded">
                    <p className="font-medium mb-1">CAMLY Token Address:</p>
                    <code className="break-all">{CAMLY_TOKEN_ADDRESS}</code>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>
        <RightSidebar />
      </div>
      <MobileNav />
    </div>
  );
};

export default Wallet;