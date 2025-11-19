import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { receiver_id, amount, message } = await req.json();

    console.log('Transfer request:', { sender: user.id, receiver_id, amount, message });

    // Validation
    if (!receiver_id || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid parameters', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (receiver_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot transfer to yourself', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get sender wallet
    const { data: senderWallet, error: senderError } = await supabaseClient
      .from('user_wallets')
      .select('camly_balance')
      .eq('user_id', user.id)
      .single();

    if (senderError || !senderWallet) {
      console.error('Sender wallet error:', senderError);
      return new Response(
        JSON.stringify({ error: 'Sender wallet not found', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Check sufficient balance
    if (Number(senderWallet.camly_balance) < amount) {
      return new Response(
        JSON.stringify({ error: 'Insufficient balance', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if receiver exists and get/create their wallet
    let { data: receiverWallet, error: receiverError } = await supabaseClient
      .from('user_wallets')
      .select('user_id, camly_balance')
      .eq('user_id', receiver_id)
      .maybeSingle();

    if (receiverError) {
      console.error('Receiver wallet query error:', receiverError);
      return new Response(
        JSON.stringify({ error: 'Database error', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // If receiver doesn't have a wallet, create one
    if (!receiverWallet) {
      console.log('Creating wallet for receiver:', receiver_id);
      const { error: createError } = await supabaseClient
        .from('user_wallets')
        .insert({ user_id: receiver_id });

      if (createError) {
        console.error('Failed to create receiver wallet:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create receiver wallet', success: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // Deduct from sender
    const { error: deductError } = await supabaseClient
      .from('user_wallets')
      .update({ 
        camly_balance: Number(senderWallet.camly_balance) - amount 
      })
      .eq('user_id', user.id);

    if (deductError) {
      console.error('Deduct error:', deductError);
      return new Response(
        JSON.stringify({ error: 'Failed to deduct amount', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Add to receiver
    const { error: addError } = await supabaseClient.rpc('increment_wallet_balance', {
      p_user_id: receiver_id,
      p_amount: amount
    });

    if (addError) {
      console.error('Add to receiver error:', addError);
      // Rollback sender deduction
      await supabaseClient
        .from('user_wallets')
        .update({ 
          camly_balance: Number(senderWallet.camly_balance)
        })
        .eq('user_id', user.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to credit receiver', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Record the transfer
    const { error: transferError } = await supabaseClient
      .from('token_transfers')
      .insert({
        sender_id: user.id,
        receiver_id: receiver_id,
        amount: amount,
        message: message || null,
        status: 'completed'
      });

    if (transferError) {
      console.error('Transfer record error:', transferError);
      // Note: Even if recording fails, the transfer was completed
    }

    // Create notification for receiver
    const { data: receiverProfile } = await supabaseClient
      .from('profiles')
      .select('username')
      .eq('id', receiver_id)
      .single();

    const { data: senderProfile } = await supabaseClient
      .from('profiles')
      .select('username, full_name')
      .eq('id', user.id)
      .single();

    await supabaseClient
      .from('notifications')
      .insert({
        user_id: receiver_id,
        type: 'token_transfer',
        content: `${senderProfile?.full_name || senderProfile?.username || 'Someone'} đã gửi cho bạn ${amount} F.U Token`,
        related_id: user.id
      });

    console.log('Transfer completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Đã chuyển ${amount} F.U Token cho ${receiverProfile?.username || 'người dùng'}`,
        amount: amount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});