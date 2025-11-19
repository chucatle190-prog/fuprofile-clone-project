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

    // Connect to BNB Chain and send on-chain transfer from treasury to user wallet
    const provider = new ethers.JsonRpcProvider(BNB_CHAIN_RPC);
    const treasuryWallet = new ethers.Wallet(treasuryPrivateKey, provider);
    const camlyContract = new ethers.Contract(CAMLY_TOKEN_ADDRESS, ERC20_ABI, treasuryWallet);

    // Ensure treasury has enough CAMLY
    const decimals = await camlyContract.decimals();
    const amountInUnits = ethers.parseUnits(withdrawAmount.toString(), decimals);
    const treasuryBalanceRaw = await camlyContract.balanceOf(treasuryWallet.address);
    const treasuryBalance = Number(ethers.formatUnits(treasuryBalanceRaw, decimals));

    if (treasuryBalance < withdrawAmount) {
      throw new Error(`Treasury không đủ CAMLY để rút. Số dư Treasury: ${treasuryBalance} CAMLY`);
    }

    console.log(`Sending on-chain withdrawal: ${withdrawAmount} CAMLY from ${treasuryWallet.address} to ${wallet.wallet_address}`);

    const tx = await camlyContract.transfer(wallet.wallet_address, amountInUnits);
    console.log('Withdrawal tx sent:', tx.hash);
    const receipt = await tx.wait();

    if (receipt.status !== 1) {
      throw new Error('Giao dịch rút CAMLY trên blockchain thất bại');
    }

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
      console.error('Error updating balance after withdraw:', updateError);
    }

    // Log to reward history for tracking
    const { error: historyError } = await supabase
      .from('reward_history')
      .insert({
        user_id: user.id,
        amount: withdrawAmount,
        reward_type: 'withdraw',
        description: `Rút về ví ${wallet.wallet_address}`,
      });

    if (historyError) {
      console.error('Error creating reward_history record for withdraw:', historyError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        amount: withdrawAmount,
        newBalance,
        transactionHash: tx.hash,
        message: `Đã rút ${withdrawAmount} Happy Camly thành công! Token đã được chuyển on-chain về ví của bạn.`,
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
