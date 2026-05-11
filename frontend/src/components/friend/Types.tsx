export interface Friend {
  id: string | number
  name: string
  avatarUrl?: string | null
  isOnline: boolean
  lastSeen?: string
  level?: number
}

export interface PendingRequest {
  id: string | number
  name: string
  avatarUrl?: string | null
  sentAgo: string
}
