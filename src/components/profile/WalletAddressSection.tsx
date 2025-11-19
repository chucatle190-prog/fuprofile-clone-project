import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Copy, Check, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFUToken } from "@/hooks/useFUToken";

interface WalletAddressSectionProps {
  userId: string;
  walletAddress: string | null;
  isOwnProfile: boolean;
  onWalletUpdate: (address: string) => void;
}

export default function WalletAddressSection({
  userId,
  walletAddress,
  isOwnProfile,
  onWalletUpdate,
}: WalletAddressSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newAddress, setNewAddress] = useState(walletAddress || "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const { account, connectWallet, isConnecting } = useFUToken();

  const handleConnectMetaMask = async () => {
    try {
      await connectWallet();
      if (account) {
        await saveWalletAddress(account);
      }
    } catch (error) {
      console.error("Failed to connect MetaMask:", error);
    }
  };

  const saveWalletAddress = async (address: string) => {
    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ wallet_address: address })
        .eq("id", userId);

      if (profileError) throw profileError;

      const { error: walletError } = await supabase
        .from("user_wallets")
        .upsert(
          {
            user_id: userId,
            wallet_address: address,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

      if (walletError) throw walletError;

      toast.success("Đã cập nhật địa chỉ ví");
      onWalletUpdate(address);
      setNewAddress(address);
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error saving wallet address:", error);
      toast.error(error.message || "Không thể cập nhật địa chỉ ví");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!newAddress.trim()) {
      toast.error("Vui lòng nhập địa chỉ ví");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(newAddress.trim())) {
      toast.error("Địa chỉ ví không hợp lệ");
      return;
    }

    await saveWalletAddress(newAddress.trim());
  };

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success("Đã sao chép địa chỉ ví");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Địa chỉ ví MetaMask
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isOwnProfile ? (
          // View mode for other users' profiles
          walletAddress ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
                <code className="flex-1 text-sm font-mono break-all">
                  {walletAddress}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                  className="shrink-0"
                >
                  <a
                    href={`https://bscscan.com/address/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Người dùng chưa kết nối ví
            </p>
          )
        ) : (
          // Edit mode for own profile
          <div className="space-y-3">
            {walletAddress && !isEditing ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
                  <code className="flex-1 text-sm font-mono break-all">
                    {walletAddress}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    className="shrink-0"
                  >
                    <a
                      href={`https://bscscan.com/address/${walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="w-full"
                >
                  Thay đổi địa chỉ ví
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="wallet-address">Địa chỉ ví BNB Chain</Label>
                  <Input
                    id="wallet-address"
                    placeholder="0x..."
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    disabled={saving}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nhập địa chỉ ví MetaMask của bạn trên mạng BNB Chain để nhận
                    Happy Camly từ bạn bè
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleConnectMetaMask}
                    disabled={isConnecting || saving}
                    variant="outline"
                    className="flex-1"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    {isConnecting ? "Đang kết nối..." : "Kết nối MetaMask"}
                  </Button>
                  {isEditing && walletAddress && (
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setNewAddress(walletAddress);
                      }}
                      variant="ghost"
                      disabled={saving}
                    >
                      Hủy
                    </Button>
                  )}
                  <Button
                    onClick={handleSave}
                    disabled={saving || !newAddress.trim()}
                    className="flex-1"
                  >
                    {saving ? "Đang lưu..." : "Lưu"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
