import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClaimRewardRequest {
  amount?: number;
  rewardType?: string;
  description?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
    const body: ClaimRewardRequest = await req.json().catch(() => ({}));
    const rewardAmount = body.amount || 10; // Default 10 F.U Token
    const rewardType = body.rewardType || 'daily_claim';
    const description = body.description || 'Nhận thưởng hàng ngày';

    console.log(`Processing claim reward for user ${user.id}: ${rewardAmount} F.U Token`);

    // Get current wallet
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (walletError) {
      throw new Error('Không tìm thấy ví người dùng');
    }

    // Calculate new balances
    const newCamlyBalance = Number(wallet.camly_balance || 0) + rewardAmount;
    const newTotalReward = Number(wallet.total_reward_camly || 0) + rewardAmount;

    // Update wallet balance
    const { error: updateError } = await supabase
      .from('user_wallets')
      .update({
        camly_balance: newCamlyBalance,
        total_reward_camly: newTotalReward,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error('Không thể cập nhật số dư ví');
    }

    // Create reward history record
    const { error: historyError } = await supabase
      .from('reward_history')
      .insert({
        user_id: user.id,
        amount: rewardAmount,
        reward_type: rewardType,
        description: description,
      });

    if (historyError) {
      console.error('Error creating reward history:', historyError);
      // Don't fail the request if history creation fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        amount: rewardAmount,
        newBalance: newCamlyBalance,
        totalReward: newTotalReward,
        message: `Đã nhận ${rewardAmount} F.U Token thành công!`,
        tokenAddress: '0x8bD5796A709663BDC2279b87fFdA3214f0ea078B',
        treasuryWallet: '0x6351265ff7f9f036eb0e29662ae0ac6982d8eba5',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in claim-reward function:', error);
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
