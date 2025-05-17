export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      creators: {
        Row: {
          created_at: string;
          id: string;
          twitch_followers: number;
          twitch_id: string;
          twitch_profile_image: string;
          twitch_username: string;
          twitch_verified: boolean;
          wallet_address: string;
          youtube_id: string;
          youtube_profile_image: string;
          youtube_subscribers: number;
          youtube_username: string;
          youtube_verified: boolean;
        };
        Insert: {
          created_at?: string;
          id?: string;
          twitch_followers?: number;
          twitch_id?: string;
          twitch_profile_image?: string;
          twitch_username?: string;
          twitch_verified?: boolean;
          wallet_address: string;
          youtube_id?: string;
          youtube_profile_image?: string;
          youtube_subscribers?: number;
          youtube_username?: string;
          youtube_verified?: boolean;
        };
        Update: {
          created_at?: string;
          id?: string;
          twitch_followers?: number;
          twitch_id?: string;
          twitch_profile_image?: string;
          twitch_username?: string;
          twitch_verified?: boolean;
          wallet_address?: string;
          youtube_id?: string;
          youtube_profile_image?: string;
          youtube_subscribers?: number;
          youtube_username?: string;
          youtube_verified?: boolean;
        };
        Relationships: [];
      };
      waitlist: {
        Row: {
          id: string;
          created_at: string;
          email: string;
          name: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          email: string;
          name: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          email?: string;
          name?: string;
        };
        Relationships: [];
      };
      meme_coins: {
        Row: {
          id: string;
          created_at: string;
          creator_wallet_address: string;
          name: string;
          symbol: string;
          initial_supply: number;
          starting_price: number;
          price_unit: string;
          description: string;
          token_mint_address: string;
          image_url?: string;
          metadata_url?: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          creator_wallet_address: string;
          name: string;
          symbol: string;
          initial_supply: number;
          starting_price: number;
          price_unit: string;
          description: string;
          token_mint_address: string;
          image_url?: string;
          metadata_url?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          creator_wallet_address?: string;
          name?: string;
          symbol?: string;
          initial_supply?: number;
          starting_price?: number;
          price_unit?: string;
          description?: string;
          token_mint_address?: string;
          image_url?: string;
          metadata_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meme_coins_creator_wallet_address_fkey";
            columns: ["creator_wallet_address"];
            referencedRelation: "creators";
            referencedColumns: ["wallet_address"];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
