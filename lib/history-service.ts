import { supabase, getUserId, type HistoryItem } from './supabase'

export async function addToHistory(contentType: string, contentId: string, contentData: any): Promise<boolean> {
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
