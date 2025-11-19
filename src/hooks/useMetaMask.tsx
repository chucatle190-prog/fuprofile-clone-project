import { useState, useEffect } from "react";
import { BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";
import { useToast } from "@/hooks/use-toast";

// BNB Chain Mainnet configuration
const BNB_CHAIN_PARAMS = {
  chainId: "0x38", // 56 in hex
  chainName: "BNB Smart Chain",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
  },
  rpcUrls: ["https://bsc-dataseed.binance.org/"],
  blockExplorerUrls: ["https://bscscan.com/"],
};

// USDT contract on BSC Testnet
const USDT_ADDRESS = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";

// ERC20 ABI for token transfers
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

export const useMetaMask = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [usdtBalance, setUsdtBalance] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkIfWalletIsConnected();
    setupEventListeners();
  }, []);

  const checkIfWalletIsConnected = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const address = accounts[0].address;
          setAccount(address);
          await updateBalances(address);
          const network = await provider.getNetwork();
          setChainId(`0x${network.chainId.toString(16)}`);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  const setupEventListeners = () => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      await updateBalances(accounts[0]);
    } else {
      setAccount(null);
      setBalance("0");
      setUsdtBalance("0");
    }
  };

  const handleChainChanged = (newChainId: string) => {
    setChainId(newChainId);
    window.location.reload();
  };

  const updateBalances = async (address: string) => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      
      // Get BNB balance
      const bnbBalance = await provider.getBalance(address);
      setBalance(formatUnits(bnbBalance, 18));

      // Get USDT balance
      const usdtContract = new Contract(USDT_ADDRESS, ERC20_ABI, provider);
      const usdtBal = await usdtContract.balanceOf(address);
      const decimals = await usdtContract.decimals();
      setUsdtBalance(formatUnits(usdtBal, decimals));
    } catch (error) {
      console.error("Error updating balances:", error);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      toast({
        title: "MetaMask không được cài đặt",
        description: "Vui lòng cài đặt MetaMask extension",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        await updateBalances(accounts[0]);
        
        // Check if on BNB Chain
        const network = await provider.getNetwork();
        const currentChainId = `0x${network.chainId.toString(16)}`;
        setChainId(currentChainId);

        if (currentChainId !== BNB_CHAIN_PARAMS.chainId) {
          await switchToBNBChain();
        } else {
          toast({
            title: "Kết nối thành công",
            description: `Địa chỉ: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
          });
        }
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Lỗi kết nối",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToBNBChain = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BNB_CHAIN_PARAMS.chainId }],
      });
      
      toast({
        title: "Đã chuyển sang BNB Chain",
        description: "Kết nối thành công",
      });
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [BNB_CHAIN_PARAMS],
          });
        } catch (addError: any) {
          toast({
            title: "Lỗi thêm mạng",
            description: addError.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Lỗi chuyển mạng",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const sendUSDT = async (toAddress: string, amount: string) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const usdtContract = new Contract(USDT_ADDRESS, ERC20_ABI, signer);
      
      const decimals = await usdtContract.decimals();
      const amountInWei = parseUnits(amount, decimals);

      const tx = await usdtContract.transfer(toAddress, amountInWei);
      
      toast({
        title: "Đang xử lý giao dịch",
        description: "Vui lòng chờ xác nhận...",
      });

      await tx.wait();
      
      // Update balances after transaction
      await updateBalances(account);
      
      return tx.hash;
    } catch (error: any) {
      console.error("Error sending USDT:", error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBalance("0");
    setUsdtBalance("0");
    setChainId(null);
  };

  return {
    account,
    balance,
    usdtBalance,
    isConnecting,
    chainId,
    isCorrectNetwork: chainId === BNB_CHAIN_PARAMS.chainId,
    connectWallet,
    disconnectWallet,
    switchToBNBChain,
    sendUSDT,
  };
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
