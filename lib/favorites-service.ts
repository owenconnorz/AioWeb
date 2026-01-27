import { supabase, isSupabaseConfigured, getUserId, type Favorite } from './supabase'

// Local storage fallback for favorites when Supabase is not configured
const FAVORITES_KEY = 'local_favorites'

function getLocalFavorites(): Favorite[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
  } catch {
    return []
  }
}

function setLocalFavorites(favorites: Favorite[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
}

export async function addFavorite(contentType: string, contentId: string, contentData: any): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    // Use localStorage fallback
    const favorites = getLocalFavorites()
    const exists = favorites.some(f => f.content_type === contentType && f.content_id === contentId)
    if (!exists) {
      favorites.unshift({
        user_id: getUserId(),
        content_type: contentType,
        content_id: contentId,
        content_data: contentData,
        created_at: new Date().toISOString()
      })
      setLocalFavorites(favorites)
    }
    return true
  }

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
  if (!isSupabaseConfigured || !supabase) {
    const favorites = getLocalFavorites()
    const filtered = favorites.filter(f => !(f.content_type === contentType && f.content_id === contentId))
    setLocalFavorites(filtered)
    return true
  }

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
  if (!isSupabaseConfigured || !supabase) {
    let favorites = getLocalFavorites()
    if (contentType) {
      favorites = favorites.filter(f => f.content_type === contentType)
    }
    return favorites
  }

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
  if (!isSupabaseConfigured || !supabase) {
    const favorites = getLocalFavorites()
    return favorites.some(f => f.content_type === contentType && f.content_id === contentId)
  }

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
