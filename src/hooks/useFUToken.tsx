import { useState, useEffect } from "react";
import { BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { FU_TOKEN_CONFIG } from "@/config/gameConfig";

const BNB_CHAIN_PARAMS = {
  chainId: "0x38",
  chainName: "BNB Smart Chain",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
  },
  rpcUrls: ["https://bsc-dataseed.binance.org/"],
  blockExplorerUrls: ["https://bscscan.com/"],
};

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

export const useFUToken = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [bnbBalance, setBnbBalance] = useState<string>("0");
  const [fuBalance, setFuBalance] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();
    setupListeners();
  }, []);

  const checkConnection = async () => {
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
        console.error("Error checking connection:", error);
      }
    }
  };

  const setupListeners = () => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      await updateBalances(accounts[0]);
    } else {
      setAccount(null);
      setBnbBalance("0");
      setFuBalance("0");
    }
  };

  const updateBalances = async (address: string) => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      
      const bnb = await provider.getBalance(address);
      setBnbBalance(formatUnits(bnb, 18));

      const fuContract = new Contract(FU_TOKEN_CONFIG.CONTRACT_ADDRESS, ERC20_ABI, provider);
      const fuBal = await fuContract.balanceOf(address);
      setFuBalance(formatUnits(fuBal, FU_TOKEN_CONFIG.DECIMALS));
    } catch (error) {
      console.error("Error updating balances:", error);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      toast({
        title: "MetaMask not installed",
        description: "Please install MetaMask extension",
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
        
        const network = await provider.getNetwork();
        const currentChainId = `0x${network.chainId.toString(16)}`;
        setChainId(currentChainId);

        if (currentChainId !== BNB_CHAIN_PARAMS.chainId) {
          await switchToBNBChain();
        } else {
          toast({
            title: "Connected",
            description: `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
          });
        }
      }
    } catch (error: any) {
      console.error("Error connecting:", error);
      toast({
        title: "Connection Error",
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
        title: "Switched to BNB Chain",
        description: "Connected successfully",
      });
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [BNB_CHAIN_PARAMS],
          });
        } catch (addError: any) {
          toast({
            title: "Error adding network",
            description: addError.message,
            variant: "destructive",
          });
        }
      }
    }
  };

  const addFUTokenToWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      toast({
        title: "MetaMask không được cài đặt",
        description: "Vui lòng cài đặt MetaMask extension",
        variant: "destructive",
      });
      return;
    }

    try {
      // Đảm bảo đang ở mạng BNB Chain trước khi import token
      if (chainId !== BNB_CHAIN_PARAMS.chainId) {
        await switchToBNBChain();
      }

      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: FU_TOKEN_CONFIG.CONTRACT_ADDRESS,
            symbol: FU_TOKEN_CONFIG.SYMBOL,
            decimals: FU_TOKEN_CONFIG.DECIMALS,
            image: '',
          },
        },
      });
      
      toast({
        title: "Đã thêm Happy Camly (CAMLY)",
        description: "Token CAMLY trên mạng BNB Chain đã được thêm vào MetaMask",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const transferFU = async (toAddress: string, amount: string) => {
    if (!account) throw new Error("Wallet not connected");

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const fuContract = new Contract(FU_TOKEN_CONFIG.CONTRACT_ADDRESS, ERC20_ABI, signer);
      
      const amountInWei = parseUnits(amount, FU_TOKEN_CONFIG.DECIMALS);
      const tx = await fuContract.transfer(toAddress, amountInWei);
      
      toast({
        title: "Processing Transaction",
        description: "Please wait for confirmation...",
      });

      await tx.wait();
      await updateBalances(account);
      
      return tx.hash;
    } catch (error: any) {
      console.error("Error transferring FU:", error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBnbBalance("0");
    setFuBalance("0");
    setChainId(null);
  };

  return {
    account,
    bnbBalance,
    fuBalance,
    isConnecting,
    chainId,
    isCorrectNetwork: chainId === BNB_CHAIN_PARAMS.chainId,
    connectWallet,
    disconnectWallet,
    switchToBNBChain,
    addFUTokenToWallet,
    transferFU,
    updateBalances,
  };
};
