/**
 * Supabase client setup
 * Provides authenticated client for database operations
 */

import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client (for API routes)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client-side hook (for React components)
// This automatically handles auth session
export function useSupabase() {
  return createClientComponentClient();
}

// Database types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      problem_attempts: {
        Row: {
          id: string;
          user_id: string;
          problem_text: string;
          topic: string;
          mastery_level: 'mastered' | 'competent' | 'struggling';
          turns_taken: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          problem_text: string;
          topic: string;
          mastery_level: 'mastered' | 'competent' | 'struggling';
          turns_taken: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          problem_text?: string;
          topic?: string;
          mastery_level?: 'mastered' | 'competent' | 'struggling';
          turns_taken?: number;
          created_at?: string;
        };
      };
      topic_progress: {
        Row: {
          id: string;
          user_id: string;
          topic: string;
          strength: number;
          review_count: number;
          ease_factor: number;
          interval_days: number;
          last_reviewed: string | null;
          next_review: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic: string;
          strength?: number;
          review_count?: number;
          ease_factor?: number;
          interval_days?: number;
          last_reviewed?: string | null;
          next_review?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic?: string;
          strength?: number;
          review_count?: number;
          ease_factor?: number;
          interval_days?: number;
          last_reviewed?: string | null;
          next_review?: string | null;
          created_at?: string;
        };
      };
      practice_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_type: 'mixed' | 'targeted' | 'review';
          problems_count: number;
          completed_count: number;
          status: 'in_progress' | 'completed' | 'abandoned';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_type: 'mixed' | 'targeted' | 'review';
          problems_count: number;
          completed_count?: number;
          status?: 'in_progress' | 'completed' | 'abandoned';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_type?: 'mixed' | 'targeted' | 'review';
          problems_count?: number;
          completed_count?: number;
          status?: 'in_progress' | 'completed' | 'abandoned';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
