export type LeaderboardPeriod = 'week' | 'all-time';

export interface XpSummary {
  level: number;
  xp: number;
  xpRequired: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  progressPercent: number;
  isCurrentUser?: boolean;
  dailyDelta?: number;
}

export type BadgeCategory = 'tasks' | 'collaboration' | 'streaks' | 'milestones';

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  category: BadgeCategory;
  earnedAt?: string;
  isNew?: boolean;
  progressCurrent?: number;
  progressTotal?: number;
}
