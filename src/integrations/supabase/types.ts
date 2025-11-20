export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          created_at?: string | null
          description: string
          icon: string
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Update: {
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      candy_crush_achievements: {
        Row: {
          achievement_name: string
          achievement_type: string
          created_at: string | null
          id: string
          progress: number
          target: number
          unlocked_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievement_name: string
          achievement_type: string
          created_at?: string | null
          id?: string
          progress?: number
          target: number
          unlocked_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievement_name?: string
          achievement_type?: string
          created_at?: string | null
          id?: string
          progress?: number
          target?: number
          unlocked_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      candy_crush_progress: {
        Row: {
          created_at: string | null
          highest_level: number
          id: string
          inventory: Json | null
          levels_completed: Json | null
          total_stars: number | null
          tutorial_completed: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          highest_level?: number
          id?: string
          inventory?: Json | null
          levels_completed?: Json | null
          total_stars?: number | null
          tutorial_completed?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          highest_level?: number
          id?: string
          inventory?: Json | null
          levels_completed?: Json | null
          total_stars?: number | null
          tutorial_completed?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      claimed_rewards: {
        Row: {
          claimed_at: string
          game_score_id: string
          id: string
          reward_amount: number
          user_id: string
        }
        Insert: {
          claimed_at?: string
          game_score_id: string
          id?: string
          reward_amount: number
          user_id: string
        }
        Update: {
          claimed_at?: string
          game_score_id?: string
          id?: string
          reward_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claimed_rewards_game_score_id_fkey"
            columns: ["game_score_id"]
            isOneToOne: true
            referencedRelation: "game_scores"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crypto_transactions: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          id: string
          marketplace_item_id: string
          network: string
          seller_id: string
          status: string
          token_symbol: string
          transaction_hash: string
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          id?: string
          marketplace_item_id: string
          network?: string
          seller_id: string
          status?: string
          token_symbol: string
          transaction_hash: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          id?: string
          marketplace_item_id?: string
          network?: string
          seller_id?: string
          status?: string
          token_symbol?: string
          transaction_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "crypto_transactions_marketplace_item_id_fkey"
            columns: ["marketplace_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_tasks: {
        Row: {
          created_at: string | null
          games_played: number | null
          id: string
          last_streak_date: string | null
          messages_sent: boolean | null
          post_created: boolean | null
          streak_count: number | null
          task_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          games_played?: number | null
          id?: string
          last_streak_date?: string | null
          messages_sent?: boolean | null
          post_created?: boolean | null
          streak_count?: number | null
          task_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          games_played?: number | null
          id?: string
          last_streak_date?: string | null
          messages_sent?: boolean | null
          post_created?: boolean | null
          streak_count?: number | null
          task_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_scores: {
        Row: {
          created_at: string | null
          game_type: string
          group_id: string
          id: string
          score: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          game_type: string
          group_id: string
          id?: string
          score?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          game_type?: string
          group_id?: string
          id?: string
          score?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_scores_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          role: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["group_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_notifications: {
        Row: {
          content: string
          created_at: string | null
          group_id: string
          id: string
          related_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          group_id: string
          id?: string
          related_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          group_id?: string
          id?: string
          related_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_notifications_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          content: string
          created_at: string | null
          group_id: string
          id: string
          image_url: string | null
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          group_id: string
          id?: string
          image_url?: string | null
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          group_id?: string
          id?: string
          image_url?: string | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          cover_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_items: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          location: string
          price: number
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          location: string
          price: number
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          location?: string
          price?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          related_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          related_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          related_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pool_games: {
        Row: {
          created_at: string
          current_player: number | null
          game_state: Json
          group_id: string
          id: string
          player1_id: string
          player2_id: string | null
          status: string | null
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          current_player?: number | null
          game_state?: Json
          group_id: string
          id?: string
          player1_id: string
          player2_id?: string | null
          status?: string | null
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          current_player?: number | null
          game_state?: Json
          group_id?: string
          id?: string
          player1_id?: string
          player2_id?: string | null
          status?: string | null
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pool_games_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string | null
          education: string | null
          from_location: string | null
          full_name: string | null
          id: string
          lives_in: string | null
          relationship: string | null
          updated_at: string | null
          username: string
          wallet_address: string | null
          work: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          education?: string | null
          from_location?: string | null
          full_name?: string | null
          id: string
          lives_in?: string | null
          relationship?: string | null
          updated_at?: string | null
          username: string
          wallet_address?: string | null
          work?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          education?: string | null
          from_location?: string | null
          full_name?: string | null
          id?: string
          lives_in?: string | null
          relationship?: string | null
          updated_at?: string | null
          username?: string
          wallet_address?: string | null
          work?: string | null
        }
        Relationships: []
      }
      quiz_completions: {
        Row: {
          completed_at: string | null
          completion_date: string
          group_id: string
          id: string
          spins_awarded: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_date?: string
          group_id: string
          id?: string
          spins_awarded?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completion_date?: string
          group_id?: string
          id?: string
          spins_awarded?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_completions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_history: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reward_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reward_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reward_type?: string
          user_id?: string
        }
        Relationships: []
      }
      season_champions: {
        Row: {
          awarded_at: string
          category: string
          id: string
          rank: number
          season_number: number
          user_id: string
        }
        Insert: {
          awarded_at?: string
          category: string
          id?: string
          rank: number
          season_number: number
          user_id: string
        }
        Update: {
          awarded_at?: string
          category?: string
          id?: string
          rank?: number
          season_number?: number
          user_id?: string
        }
        Relationships: []
      }
      shares: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          image_url: string
          music_artist: string | null
          music_name: string | null
          music_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          image_url: string
          music_artist?: string | null
          music_name?: string | null
          music_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string
          music_artist?: string | null
          music_name?: string | null
          music_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      story_reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      token_transfers: {
        Row: {
          amount: number
          created_at: string
          id: string
          message: string | null
          receiver_id: string
          sender_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          message?: string | null
          receiver_id: string
          sender_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          message?: string | null
          receiver_id?: string
          sender_id?: string
          status?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_game_spins: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          remaining_spins: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          remaining_spins?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          remaining_spins?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_game_spins_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_levels: {
        Row: {
          created_at: string | null
          experience_points: number
          id: string
          level: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          experience_points?: number
          id?: string
          level?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          experience_points?: number
          id?: string
          level?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          bnb_balance: number | null
          btc_balance: number | null
          camly_balance: number | null
          created_at: string | null
          id: string
          total_reward_camly: number | null
          total_usd: number | null
          updated_at: string | null
          usdt_balance: number | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          bnb_balance?: number | null
          btc_balance?: number | null
          camly_balance?: number | null
          created_at?: string | null
          id?: string
          total_reward_camly?: number | null
          total_usd?: number | null
          updated_at?: string | null
          usdt_balance?: number | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          bnb_balance?: number | null
          btc_balance?: number | null
          camly_balance?: number | null
          created_at?: string | null
          id?: string
          total_reward_camly?: number | null
          total_usd?: number | null
          updated_at?: string | null
          usdt_balance?: number | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_direct_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      ensure_user_wallet: { Args: { p_user_id: string }; Returns: undefined }
      get_current_season: { Args: never; Returns: number }
      has_group_role: {
        Args: { _group_id: string; _role: string; _user_id: string }
        Returns: boolean
      }
      increment_wallet_balance: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      group_role: "admin" | "moderator" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      group_role: ["admin", "moderator", "member"],
    },
  },
} as const
