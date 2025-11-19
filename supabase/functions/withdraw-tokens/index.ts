import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0'
import { ethers } from 'https://esm.sh/ethers@6.13.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Happy Camly Coin contract address on BNB Chain
const CAMLY_TOKEN_ADDRESS = '0x0910320181889feFDE0BB1Ca63962b0A8882e413'
const BNB_CHAIN_RPC = 'https://bsc-dataseed.binance.org/'

// ERC20 ABI for transfer function
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address owner) view returns (uint256)',
]

interface WithdrawRequest {
  amount: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const treasuryPrivateKey = Deno.env.get('TREASURY_PRIVATE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!treasuryPrivateKey) {
      throw new Error('Treasury private key not configured');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const body: WithdrawRequest = await req.json();
    const withdrawAmount = body.amount;

    if (!withdrawAmount || withdrawAmount <= 0) {
      throw new Error('Số lượng rút không hợp lệ');
    }

    console.log(`Processing withdraw for user ${user.id}: ${withdrawAmount} Happy Camly`);

    // Get user wallet
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (walletError) {
      throw new Error('Lỗi khi truy vấn ví người dùng');
    }

    if (!wallet) {
      throw new Error('Không tìm thấy ví người dùng. Vui lòng thử claim reward trước.');
    }

    if (!wallet.wallet_address) {
      throw new Error('Vui lòng kết nối ví MetaMask trước');
    }

    // Check if user has enough balance
    const currentBalance = Number(wallet.camly_balance || 0);
    if (currentBalance < withdrawAmount) {
      throw new Error(`Số dư không đủ. Số dư hiện tại: ${currentBalance} Camly`);
    }

    // Setup Web3 provider and wallet
    const provider = new ethers.JsonRpcProvider(BNB_CHAIN_RPC);
    const treasuryWallet = new ethers.Wallet(treasuryPrivateKey, provider);
    
    console.log(`Treasury wallet address: ${treasuryWallet.address}`);

    // Connect to Happy Camly Token contract
    const tokenContract = new ethers.Contract(CAMLY_TOKEN_ADDRESS, ERC20_ABI, treasuryWallet);

    // Get token decimals
    const decimals = await tokenContract.decimals();
    const amountInWei = ethers.parseUnits(withdrawAmount.toString(), decimals);

    console.log(`Transferring ${withdrawAmount} Camly (${amountInWei} wei) to ${wallet.wallet_address}`);

    // Check treasury balance
    const treasuryBalance = await tokenContract.balanceOf(treasuryWallet.address);
    console.log(`Treasury balance: ${ethers.formatUnits(treasuryBalance, decimals)} Camly`);

    if (treasuryBalance < amountInWei) {
      throw new Error('Ví treasury không đủ token. Vui lòng liên hệ admin.');
    }

    // Send transaction
    const tx = await tokenContract.transfer(wallet.wallet_address, amountInWei);
    console.log(`Transaction sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

    // Update database - subtract from balance
    const newBalance = currentBalance - withdrawAmount;
    const { error: updateError } = await supabase
      .from('user_wallets')
      .update({
        camly_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating balance:', updateError);
      // Transaction already sent, so we log but don't fail
    }

    // Create transaction record
    const { error: txError } = await supabase
      .from('crypto_transactions')
      .insert({
        buyer_id: user.id,
        seller_id: user.id, // Withdrawal to self
        amount: withdrawAmount,
        token_symbol: 'F.U',
        transaction_hash: tx.hash,
        status: 'confirmed',
        network: 'BSC Testnet',
      });

    if (txError) {
      console.error('Error creating transaction record:', txError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        amount: withdrawAmount,
        newBalance: newBalance,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        explorerUrl: `https://bscscan.com/tx/${tx.hash}`,
        message: `Đã rút ${withdrawAmount} Happy Camly thành công!`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in withdraw-tokens function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
