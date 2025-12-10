export interface CreateGalleryParams {
  title?: string
  description?: string
  image_url?: string
  rarity?: number
  explanation?: string
}

export interface UserInfo {
  id: number
  openid: string
  nickname?: string
  avatar_url?: string
  current_merit?: number
  pool_level?: number
  total_merit?: number
  settings?: any
}