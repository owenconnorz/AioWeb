import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

let userId: string | null = null

export function getUserId(): string {
  if (userId) return userId

  if (typeof window !== 'undefined') {
    userId = localStorage.getItem('anonymous_user_id')

    if (!userId) {
      userId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      localStorage.setItem('anonymous_user_id', userId)
    }
  }

  return userId || 'anonymous'
}

export interface Favorite {
  id?: string
  user_id: string
  content_type: string
  content_id: string
  content_data: any
  created_at?: string
}

export interface HistoryItem {
  id?: string
  user_id: string
  content_type: string
  content_id: string
  content_data: any
  viewed_at?: string
  view_count?: number
}

export interface UserSettings {
  user_id: string
  settings: any
  updated_at?: string
}
