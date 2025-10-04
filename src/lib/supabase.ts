import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      transport: {
        Row: {
          room_id: string
          bpm: number
          key_root: string
          scale_mode: string
          bar_start: string
          is_playing: boolean
          updated_at: string | null
        }
        Insert: {
          room_id: string
          bpm?: number
          key_root?: string
          scale_mode?: string
          bar_start?: string
          is_playing?: boolean
          updated_at?: string | null
        }
        Update: {
          room_id?: string
          bpm?: number
          key_root?: string
          scale_mode?: string
          bar_start?: string
          is_playing?: boolean
          updated_at?: string | null
        }
      }
      progression: {
        Row: {
          room_id: string
          bar: number
          rn: string
          duration_bars: number
        }
        Insert: {
          room_id: string
          bar: number
          rn: string
          duration_bars?: number
        }
        Update: {
          room_id?: string
          bar?: number
          rn?: string
          duration_bars?: number
        }
      }
      instrument_params: {
        Row: {
          room_id: string
          instrument: 'bass' | 'drums' | 'harmony' | 'melody'
          params: Record<string, unknown>
          updated_at: string | null
        }
        Insert: {
          room_id: string
          instrument: 'bass' | 'drums' | 'harmony' | 'melody'
          params: Record<string, unknown>
          updated_at?: string | null
        }
        Update: {
          room_id?: string
          instrument?: 'bass' | 'drums' | 'harmony' | 'melody'
          params?: Record<string, unknown>
          updated_at?: string | null
        }
      }
    }
  }
}
