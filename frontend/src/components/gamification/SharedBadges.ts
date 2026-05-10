import { CheckCircle2, FolderOpen, Target, Users, MessageSquare, Flame, Zap, Trophy, Layers, Star } from 'lucide-react';
import type { BadgeItem } from './Types';

export const SHARED_BADGES: BadgeItem[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Created your first task',
    Icon: CheckCircle2,
    color: 'bg-emerald-500',
    xpReward: 50,
    category: 'tasks',
    earnedAt: '10 May 2026',
    isNew: true,
    requirement: 'Create 1 task in any board'
  },
  {
    id: 'backlog-builder',
    name: 'Backlog Builder',
    description: 'Created 10 backlog items',
    Icon: FolderOpen,
    color: 'bg-blue-500',
    xpReward: 150,
    category: 'tasks',
    earnedAt: '08 May 2026',
    requirement: 'Create 10 items in Backlog column'
  },
  {
    id: 'task-master',
    name: 'Task Master',
    description: 'Completed 50 tasks successfully',
    Icon: Target,
    color: 'bg-cyan-600',
    xpReward: 300,
    category: 'tasks',
    progressCurrent: 23,
    progressTotal: 50,
    requirement: 'Move 50 tasks to Done column'
  },
  {
    id: 'team-player',
    name: 'Team Player',
    description: 'Participates in 5 different workspaces',
    Icon: Users,
    color: 'bg-purple-500',
    xpReward: 200,
    category: 'collaboration',
    earnedAt: '05 May 2026',
    requirement: 'Be member of 5 organizations/workspaces'
  },
  {
    id: 'commentator',
    name: 'Commentator',
    description: 'Left 20 comments on tasks',
    Icon: MessageSquare,
    color: 'bg-amber-500',
    xpReward: 100,
    category: 'collaboration',
    earnedAt: '09 May 2026',
    requirement: 'Add 20 comments on different tasks'
  },
  {
    id: 'week-streak',
    name: 'Week Streak',
    description: '7 consecutive days of activity',
    Icon: Flame,
    color: 'bg-orange-500',
    xpReward: 100,
    category: 'streaks',
    earnedAt: '03 May 2026',
    requirement: 'Login and interact for 7 consecutive days'
  },
  {
    id: 'marathoner',
    name: 'Marathoner',
    description: '30 consecutive days of productivity',
    Icon: Zap,
    color: 'bg-red-500',
    xpReward: 500,
    category: 'streaks',
    progressCurrent: 12,
    progressTotal: 30,
    requirement: 'Maintain 30-day activity streak'
  },
  {
    id: 'sprint-champion',
    name: 'Sprint Champion',
    description: 'Completed all tasks in a sprint',
    Icon: Trophy,
    color: 'bg-yellow-500',
    xpReward: 250,
    category: 'milestones',
    earnedAt: '01 May 2026',
    requirement: '100% completion rate in a sprint'
  },
  {
    id: 'organizer',
    name: 'Organizer',
    description: 'Created 10 custom Kanban columns',
    Icon: Layers,
    color: 'bg-indigo-500',
    xpReward: 150,
    category: 'milestones',
    progressCurrent: 4,
    progressTotal: 10,
    requirement: 'Create 10 custom columns in boards'
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Platform access during beta period',
    Icon: Star,
    color: 'bg-pink-500',
    xpReward: 1000,
    category: 'milestones',
    earnedAt: '15 Apr 2026',
    requirement: 'Create account during beta phase (limited)'
  },
];

export default SHARED_BADGES;
