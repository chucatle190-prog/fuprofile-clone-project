import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting season champions award process...')

    // Get current season and previous season
    const { data: currentSeasonData, error: seasonError } = await supabase
      .rpc('get_current_season')
    
    if (seasonError) {
      console.error('Error getting current season:', seasonError)
      throw seasonError
    }

    const previousSeason = currentSeasonData - 1
    console.log('Awarding champions for season:', previousSeason)

    // Check if champions for this season have already been awarded
    const { data: existingChampions, error: existingError } = await supabase
      .from('season_champions')
      .select('*')
      .eq('season_number', previousSeason)
      .limit(1)

    if (existingError) {
      console.error('Error checking existing champions:', existingError)
      throw existingError
    }

    if (existingChampions && existingChampions.length > 0) {
      console.log('Champions already awarded for season', previousSeason)
      return new Response(
        JSON.stringify({ message: 'Champions already awarded for this season' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Get top 3 holders
    const { data: topHolders, error: holdersError } = await supabase
      .from('user_wallets')
      .select('user_id, camly_balance')
      .order('camly_balance', { ascending: false })
      .limit(3)

    if (holdersError) {
      console.error('Error fetching holders:', holdersError)
      throw holdersError
    }

    // Get top 3 receivers
    const { data: topReceivers, error: receiversError } = await supabase
      .from('token_transfers')
      .select('receiver_id, amount')
      .then(({ data, error }) => {
        if (error) return { data: null, error }
        
        const grouped = data?.reduce((acc: any, curr: any) => {
          if (!acc[curr.receiver_id]) {
            acc[curr.receiver_id] = { user_id: curr.receiver_id, total: 0 }
          }
          acc[curr.receiver_id].total += Number(curr.amount)
          return acc
        }, {})
        
        const sorted = Object.values(grouped || {})
          .sort((a: any, b: any) => b.total - a.total)
          .slice(0, 3)
        
        return { data: sorted, error: null }
      })

    if (receiversError) {
      console.error('Error fetching receivers:', receiversError)
      throw receiversError
    }

    // Get top 3 senders
    const { data: topSenders, error: sendersError } = await supabase
      .from('token_transfers')
      .select('sender_id, amount')
      .then(({ data, error }) => {
        if (error) return { data: null, error }
        
        const grouped = data?.reduce((acc: any, curr: any) => {
          if (!acc[curr.sender_id]) {
            acc[curr.sender_id] = { user_id: curr.sender_id, total: 0 }
          }
          acc[curr.sender_id].total += Number(curr.amount)
          return acc
        }, {})
        
        const sorted = Object.values(grouped || {})
          .sort((a: any, b: any) => b.total - a.total)
          .slice(0, 3)
        
        return { data: sorted, error: null }
      })

    if (sendersError) {
      console.error('Error fetching senders:', sendersError)
      throw sendersError
    }

    // Award champions
    const championsToAward: Array<{
      user_id: string;
      season_number: number;
      rank: number;
      category: 'holder' | 'receiver' | 'sender';
    }> = []

    // Holders
    topHolders?.forEach((holder: any, index: number) => {
      championsToAward.push({
        user_id: holder.user_id,
        season_number: previousSeason,
        rank: index + 1,
        category: 'holder'
      })
    })

    // Receivers
    topReceivers?.forEach((receiver: any, index: number) => {
      championsToAward.push({
        user_id: receiver.user_id,
        season_number: previousSeason,
        rank: index + 1,
        category: 'receiver'
      })
    })

    // Senders
    topSenders?.forEach((sender: any, index: number) => {
      championsToAward.push({
        user_id: sender.user_id,
        season_number: previousSeason,
        rank: index + 1,
        category: 'sender'
      })
    })

    console.log('Champions to award:', championsToAward)

    // Insert champions
    const { error: insertError } = await supabase
      .from('season_champions')
      .insert(championsToAward)

    if (insertError) {
      console.error('Error inserting champions:', insertError)
      throw insertError
    }

    console.log('Successfully awarded season champions')

    return new Response(
      JSON.stringify({ 
        message: 'Season champions awarded successfully',
        season: previousSeason,
        champions: championsToAward 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in award-season-champions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})