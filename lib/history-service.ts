import { supabase, isSupabaseConfigured, getUserId, type HistoryItem } from './supabase'

// Local storage fallback for history when Supabase is not configured
const HISTORY_KEY = 'local_history'

function getLocalHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

function setLocalHistory(history: HistoryItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export async function addToHistory(contentType: string, contentId: string, contentData: any): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    // Use localStorage fallback
    const history = getLocalHistory()
    const existingIndex = history.findIndex(h => h.content_type === contentType && h.content_id === contentId)
    
    if (existingIndex >= 0) {
      const existing = history[existingIndex]
      existing.viewed_at = new Date().toISOString()
      existing.view_count = (existing.view_count || 0) + 1
      existing.content_data = contentData
      history.splice(existingIndex, 1)
      history.unshift(existing)
    } else {
      history.unshift({
        user_id: getUserId(),
        content_type: contentType,
        content_id: contentId,
        content_data: contentData,
        viewed_at: new Date().toISOString(),
        view_count: 1
      })
    }
    
    // Keep only last 100 items
    setLocalHistory(history.slice(0, 100))
    return true
  }

  try {
    const { data: existing } = await supabase
      .from('user_history')
      .select('*')
      .eq('user_id', getUserId())
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('user_history')
        .update({
          viewed_at: new Date().toISOString(),
          view_count: (existing.view_count || 0) + 1,
          content_data: contentData
        })
        .eq('id', existing.id)

      return !error
    } else {
      const { error } = await supabase
        .from('user_history')
        .insert({
          user_id: getUserId(),
          content_type: contentType,
          content_id: contentId,
          content_data: contentData,
          view_count: 1
        })

      return !error
    }
  } catch (error) {
    console.error('Error adding to history:', error)
    return false
  }
}

export async function getHistory(contentType?: string, limit: number = 50): Promise<HistoryItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    let history = getLocalHistory()
    if (contentType) {
      history = history.filter(h => h.content_type === contentType)
    }
    return history.slice(0, limit)
  }

  try {
    let query = supabase
      .from('user_history')
      .select('*')
      .eq('user_id', getUserId())
      .order('viewed_at', { ascending: false })
      .limit(limit)

    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting history:', error)
    return []
  }
}

export async function clearHistory(contentType?: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    if (contentType) {
      const history = getLocalHistory()
      const filtered = history.filter(h => h.content_type !== contentType)
      setLocalHistory(filtered)
    } else {
      setLocalHistory([])
    }
    return true
  }

  try {
    let query = supabase
      .from('user_history')
      .delete()
      .eq('user_id', getUserId())

    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    const { error } = await query
    return !error
  } catch (error) {
    console.error('Error clearing history:', error)
    return false
  }
}
