export interface Stats {
  tasksCompleted: number
  tasksAssigned: number
  friends: number
}

export interface Data {
  name: string
  bio: string
  avatarUrl?: string | null
  isOnline: boolean
  lastSeen?: string
  stats: Stats
  level: number
  xp: number
  xpRequired: number
}
