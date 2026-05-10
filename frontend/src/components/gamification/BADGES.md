# Badge System Documentation

## Overview

The ProdDT badge system recognizes and rewards users for specific activities within the platform. Each badge grants XP and represents an achievement in the user's journey.

## Badge Structure

```typescript
interface BadgeItem {
  id: string;                 // Unique identifier
  name: string;               // Badge name
  description: string;        // Short description
  Icon: React.ElementType;    // Icon (Lucide)
  color: string;              // Badge color (Tailwind)
  xpReward: number;           // XP granted when unlocked
  category: BadgeCategory;    // Category: 'tasks' | 'collaboration' | 'streaks' | 'milestones'
  earnedAt?: string;          // Unlock date
  isNew?: boolean;           // New badge (highlight)
  progressCurrent?: number;  // Current progress
  progressTotal?: number;     // Target to unlock
  requirement: string;        // Requirement to earn
}
```

## Predefined Badges

### 1. First Steps
- **ID**: `first-steps`
- **Name**: First Steps
- **Description**: Created your first task in the system
- **Icon**: `CheckCircle2`
- **Color**: `bg-emerald-500`
- **XP**: 50
- **Category**: `tasks`
- **Requirement**: Create 1 task in any board

### 2. Backlog Builder
- **ID**: `backlog-builder`
- **Name**: Backlog Builder
- **Description**: Created 10 backlog items for the project
- **Icon**: `FolderOpen`
- **Color**: `bg-blue-500`
- **XP**: 150
- **Category**: `tasks`
- **Requirement**: Create 10 items in the Backlog column

### 3. Task Master
- **ID**: `task-master`
- **Name**: Task Master
- **Description**: Completed 50 tasks successfully
- **Icon**: `Target`
- **Color**: `bg-cyan-600`
- **XP**: 300
- **Category**: `tasks`
- **Requirement**: Move 50 tasks to the "Done" column

### 4. Team Player
- **ID**: `team-player`
- **Name**: Team Player
- **Description**: Participates in 5 different workspaces
- **Icon**: `Users`
- **Color**: `bg-purple-500`
- **XP**: 200
- **Category**: `collaboration`
- **Requirement**: Be a member of 5 organizations/workspaces

### 5. Commentator
- **ID**: `commentator`
- **Name**: Commentator
- **Description**: Left 20 comments on tasks
- **Icon**: `MessageSquare`
- **Color**: `bg-amber-500`
- **XP**: 100
- **Category**: `collaboration`
- **Requirement**: Add 20 comments on different tasks

### 6. Week Streak
- **ID**: `week-streak`
- **Name**: Week Streak
- **Description**: 7 consecutive days of activity
- **Icon**: `Flame`
- **Color**: `bg-orange-500`
- **XP**: 100
- **Category**: `streaks`
- **Requirement**: Login and interact for 7 consecutive days

### 7. Marathoner
- **ID**: `marathoner`
- **Name**: Marathoner
- **Description**: 30 consecutive days of productivity
- **Icon**: `Zap`
- **Color**: `bg-red-500`
- **XP**: 500
- **Category**: `streaks`
- **Requirement**: Maintain a 30-day activity streak

### 8. Sprint Champion
- **ID**: `sprint-champion`
- **Name**: Sprint Champion
- **Description**: Completed all tasks in a sprint
- **Icon**: `Trophy`
- **Color**: `bg-yellow-500`
- **XP**: 250
- **Category**: `milestones`
- **Requirement**: 100% completion rate in a sprint

### 9. Organizer
- **ID**: `organizer`
- **Name**: Organizer
- **Description**: Created 10 custom Kanban columns
- **Icon**: `Layers`
- **Color**: `bg-indigo-500`
- **XP**: 150
- **Category**: `milestones`
- **Requirement**: Create 10 custom columns in boards

### 10. Early Bird
- **ID**: `early-bird`
- **Name**: Early Bird
- **Description**: Platform access during the beta period
- **Icon**: `Star`
- **Color**: `bg-pink-500`
- **XP**: 1000
- **Category**: `milestones`
- **Requirement**: Create account during the beta phase (limited)

## Usage Example

```typescript
import { FolderOpen, Users, Target, CheckCircle2, MessageSquare, Flame, Zap, Trophy, Layers, Star } from 'lucide-react';

const DEFAULT_BADGES: BadgeItem[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Created your first task in the system',
    Icon: CheckCircle2,
    color: 'bg-emerald-500',
    xpReward: 50,
    category: 'tasks',
    earnedAt: '2026-05-10',
    requirement: 'Create 1 task in any board'
  },
  // ... other badges
];
```

## Categories

| Category | Description |
|----------|-------------|
| `tasks` | Badges related to task creation and completion |
| `collaboration` | Badges for social interaction and teamwork |
| `streaks` | Badges for consistency and daily usage |
| `milestones` | Special badges for important milestones |

## Color Palette

| Badge Tier | Color | Usage |
|------------|-------|-------|
| Bronze | `bg-amber-500` | Initial badges (50-100 XP) |
| Silver | `bg-slate-400` | Intermediate badges (150-250 XP) |
| Gold | `bg-yellow-500` | Advanced badges (300-500 XP) |
| Platinum | `bg-purple-500` | Rare badges (500+ XP) |
| Special | `bg-pink-500` | Limited/event badges |
