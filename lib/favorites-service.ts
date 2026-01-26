import { supabase, getUserId, type Favorite } from './supabase'

export async function addFavorite(contentType: string, contentId: string, contentData: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: getUserId(),
        content_type: contentType,
        content_id: contentId,
        content_data: contentData
      })

    return !error
  } catch (error) {
    console.error('Error adding favorite:', error)
    return false
  }
}

export async function removeFavorite(contentType: string, contentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', getUserId())
      .eq('content_type', contentType)
      .eq('content_id', contentId)

    return !error
  } catch (error) {
    console.error('Error removing favorite:', error)
    return false
  }
}

export async function getFavorites(contentType?: string): Promise<Favorite[]> {
  try {
    let query = supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', getUserId())
      .order('created_at', { ascending: false })

    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting favorites:', error)
    return []
  }
}

export async function isFavorite(contentType: string, contentId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', getUserId())
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .maybeSingle()

    return !!data
  } catch (error) {
    console.error('Error checking favorite:', error)
    return false
  }
}
