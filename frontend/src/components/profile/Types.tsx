import { User } from '../../types/user'
export interface Stats {
  tasksCompleted: number
  tasksAssigned: number
  friends: number
}

export interface Data {
  user: User
  isOnline: boolean
  lastSeen?: string
  stats: Stats
  level: number
  xp: number
  xpRequired: number
}
