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
import TokenAnimation from "@/components/TokenAnimation";

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

const BNB_CHAIN = {
  chainId: "0x38",
  chainName: "BNB Smart Chain",
  rpcUrls: ["https://bsc-dataseed.binance.org/"],
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
  },
  blockExplorerUrls: ["https://bscscan.com/"],
};

const CAMLY_TOKEN_ADDRESS = "0x0910320181889feFDE0BB1Ca63962b0A8882e413";
const TREASURY_WALLET = "0xb86d3e56abbaf330be6647329fca76521d22bf80";

const Wallet = () => {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTokenAnimation, setShowTokenAnimation] = useState(false);
  const [tokenAnimAmount, setTokenAnimAmount] = useState(0);
  const [tokenAnimType, setTokenAnimType] = useState<'receive' | 'send'>('receive');
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
        params: [BNB_CHAIN],
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

  const disconnectWallet = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from("user_wallets")
        .update({ wallet_address: null })
        .eq("user_id", user.id);

      setWallet({ ...wallet!, wallet_address: null });

      toast({
        title: "Đã ngắt kết nối",
        description: "Ví đã được ngắt kết nối",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Detect MetaMask account changes
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected all accounts
          await disconnectWallet();
        } else if (accounts[0] !== wallet?.wallet_address && user) {
          // User switched to a different account
          const newAddress = accounts[0];
          
          await supabase
            .from("user_wallets")
            .update({ wallet_address: newAddress })
            .eq("user_id", user.id);

          setWallet({ ...wallet!, wallet_address: newAddress });

          toast({
            title: "Đã đổi ví",
            description: `Đã chuyển sang: ${newAddress.slice(0, 6)}...${newAddress.slice(-4)}`,
          });
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, [wallet?.wallet_address, user]);

  const claimReward = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('claim-reward', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: {
          amount: 10,
          rewardType: 'daily_claim',
          description: 'Nhận thưởng Happy Camly hàng ngày'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Thành công!",
          description: data.message,
        });
        
        // Show animation
        setTokenAnimAmount(10);
        setTokenAnimType('receive');
        setShowTokenAnimation(true);
        
        // Refresh wallet data
        await fetchWallet(user.id);
      } else {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể nhận thưởng",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const withdrawTokens = async () => {
    if (!user || !wallet?.wallet_address) {
      toast({
        title: "Lỗi",
        description: "Vui lòng kết nối ví MetaMask trước",
        variant: "destructive",
      });
      return;
    }

    const withdrawAmount = wallet.camly_balance;
    if (withdrawAmount <= 0) {
      toast({
        title: "Thông báo",
        description: "Không có Happy Camly để rút",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      toast({
        title: "Đang xử lý",
        description: "Đang gửi giao dịch lên blockchain...",
      });

      const { data, error } = await supabase.functions.invoke('withdraw-tokens', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: {
          amount: withdrawAmount
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Rút Happy Camly thành công!",
          description: (
            <div className="space-y-1">
              <p>Đã rút {data.amount} Happy Camly</p>
              <a 
                href={data.explorerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline block"
              >
                Xem giao dịch trên BSCScan →
              </a>
            </div>
          ),
        });
        
        // Show animation
        setTokenAnimAmount(data.amount);
        setTokenAnimType('send');
        setShowTokenAnimation(true);
        
        // Refresh wallet data
        await fetchWallet(user.id);
      } else {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      toast({
        title: "Lỗi rút Happy Camly",
        description: error.message || "Không thể rút Happy Camly. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <TokenAnimation 
        show={showTokenAnimation}
        amount={tokenAnimAmount}
        type={tokenAnimType}
        onComplete={() => setShowTokenAnimation(false)}
      />
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
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm text-muted-foreground">Địa chỉ ví</Label>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={disconnectWallet}
                        className="text-destructive hover:text-destructive"
                      >
                        Disconnect
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm bg-background px-3 py-2 rounded">
                        {wallet.wallet_address}
                      </code>
                      <Button size="sm" variant="ghost" onClick={copyAddress}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Bạn có thể đổi ví bằng cách switch account trong MetaMask
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/10 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Tổng USD</p>
                      <p className="text-2xl font-bold text-primary">${wallet.total_usd}</p>
                    </div>
                    <div className="bg-accent/10 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Total Reward</p>
                      <p className="text-2xl font-bold text-accent">{wallet.total_reward_camly} Camly</p>
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
                      <span className="font-medium">Happy Camly</span>
                      <span className="font-semibold">{wallet.camly_balance}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                      <span className="font-medium">BTC</span>
                      <span className="font-semibold">{wallet.btc_balance}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-col h-auto py-4"
                      onClick={claimReward}
                      disabled={loading}
                    >
                      <Gift className="h-5 w-5 mb-2" />
                      <span>Claim Reward</span>
                    </Button>
                    <Button 
                      variant="default" 
                      className="flex-col h-auto py-4 bg-gradient-to-r from-primary to-accent"
                      onClick={withdrawTokens}
                      disabled={loading || !wallet.camly_balance || wallet.camly_balance <= 0}
                    >
                      <Download className="h-5 w-5 mb-2" />
                      <span>Rút về ví</span>
                    </Button>
                  </div>

                  {wallet.camly_balance > 0 && (
                    <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Số dư có thể rút</p>
                      <p className="text-2xl font-bold text-accent">{wallet.camly_balance} Camly</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Token sẽ được chuyển từ treasury vào ví MetaMask của bạn
                      </p>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate("/transactions")}
                  >
                    Xem lịch sử giao dịch
                  </Button>

                  <div className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded">
                    <p className="font-medium mb-1">Happy Camly Address (BNB Chain):</p>
                    <code className="break-all">{CAMLY_TOKEN_ADDRESS}</code>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>
        <RightSidebar />
      </div>
      <MobileNav user={user} />
    </div>
  );
};

export default Wallet;