import { Crown } from 'lucide-react';
import type { LeaderboardEntry, LeaderboardPeriod } from '../../components/gamification/Types';

interface LeaderboardPageProps {
  entries: LeaderboardEntry[];
  period: LeaderboardPeriod;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  onOpenBadges: () => void;
}

const PODIUM_COLORS = {
  1: 'from-amber-400 to-amber-500 ring-amber-200',
  2: 'from-slate-300 to-slate-400 ring-slate-200',
  3: 'from-orange-300 to-orange-400 ring-orange-200',
} as const;

function formatXp(value: number) {
  return `${value.toLocaleString()} XP`;
}

export default function LeaderboardPage({ entries, period, onPeriodChange, onOpenBadges }: LeaderboardPageProps) {
  const sortedEntries = [...entries].sort((a, b) => b.xp - a.xp);
  const podium = sortedEntries.slice(0, 3);
  const rest = sortedEntries.slice(3);
  const currentUser = sortedEntries.find((entry) => entry.isCurrentUser);
  const currentRank = currentUser ? sortedEntries.findIndex((entry) => entry.id === currentUser.id) + 1 : null;

  const renderPodiumCard = (entry: LeaderboardEntry, rank: 1 | 2 | 3) => {
    const ringClass = PODIUM_COLORS[rank].split(' ')[2];
    const gradientClass = PODIUM_COLORS[rank].split(' ').slice(0, 2).join(' ');
    const avatarSizeClass = rank === 1 ? 'h-16 w-16 sm:h-20 sm:w-20' : 'h-12 w-12 sm:h-16 sm:w-16';
    const pedestalHeightClass = rank === 1 ? 'h-20 sm:h-24' : rank === 2 ? 'h-14 sm:h-16' : 'h-10 sm:h-12';

    return (
      <div key={entry.id} className={`flex flex-col items-center gap-2 ${rank === 1 ? 'sm:-mt-5' : ''}`}>
        {rank === 1 ? (
          <div className="mb-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
            Leader
          </div>
        ) : null}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-500">{formatXp(entry.xp)}</span>
        <div className="relative">
          {rank === 1 ? <Crown className="absolute -top-5 left-1/2 h-4 w-4 -translate-x-1/2 text-amber-500" /> : null}
          <img
            src={entry.avatar}
            alt={entry.name}
            className={`${avatarSizeClass} rounded-full border-4 border-white ring-4 ${ringClass} object-cover`}
          />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            {rank}
          </span>
        </div>
        <p className="font-display text-sm font-bold text-slate-900">{entry.name}</p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">LVL {entry.level}</span>
        <div className={`flex w-20 sm:w-24 items-center justify-center rounded-t-xl bg-gradient-to-b ${pedestalHeightClass} ${gradientClass}`}>
          <span className="font-display text-2xl sm:text-3xl font-black text-white/70">{rank}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-4 sm:px-6 py-4 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">Leaderboard</h1>
            <p className="mt-1 text-sm text-slate-500">XP ranking for active members</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => onPeriodChange('week')}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                  period === 'week' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                This week
              </button>
              <button
                onClick={() => onPeriodChange('all-time')}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                  period === 'all-time' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All-time
              </button>
            </div>
            <button
              onClick={onOpenBadges}
              className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-100 flex-shrink-0"
            >
              View badges
            </button>
          </div>
        </div>

        {podium.length === 3 ? (
          <div className="mb-6 sm:mb-10 flex flex-wrap items-end justify-center gap-3 sm:gap-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            {renderPodiumCard(podium[1], 2)}
            {renderPodiumCard(podium[0], 1)}
            {renderPodiumCard(podium[2], 3)}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <p className="font-mono text-xs uppercase tracking-wider text-slate-400">Ranks</p>
          </div>
          <div className="divide-y divide-slate-100">
            {rest.map((entry, idx) => {
              const rank = idx + 4;
              return (
                <div key={entry.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 transition-colors hover:bg-slate-50">
                  <span className="w-5 text-right font-mono text-sm font-bold text-slate-400">{rank}</span>
                  <img src={entry.avatar} alt={entry.name} className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{entry.name}</p>
                    <div className="mt-1 h-1.5 w-24 sm:w-32 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-cyan-400" style={{ width: `${entry.progressPercent}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0 ml-8 sm:ml-0">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">LVL {entry.level}</span>
                    <span className="w-20 sm:w-24 text-right font-mono text-sm font-semibold text-slate-700">{formatXp(entry.xp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {currentUser && currentRank ? (
          <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 sm:px-5 py-4">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4">
              <span className="hidden sm:inline rounded-full bg-cyan-100 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase text-cyan-700">
                You
              </span>
              <span className="w-5 text-right font-mono text-sm font-bold text-cyan-700">{currentRank}</span>
              <img src={currentUser.avatar} alt={currentUser.name} className="h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-cyan-300" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-cyan-900 truncate">
                  <span className="sm:hidden mr-2 rounded-full bg-cyan-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-cyan-700">You</span>
                  {currentUser.name}
                </p>
                <div className="mt-1 h-1.5 w-24 sm:w-32 overflow-hidden rounded-full bg-cyan-100">
                  <div className="h-full rounded-full bg-cyan-500" style={{ width: `${currentUser.progressPercent}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0 ml-8 sm:ml-0">
                <span className="rounded-full bg-cyan-100 px-2 py-0.5 font-mono text-xs text-cyan-700">LVL {currentUser.level}</span>
                <span className="w-20 sm:w-24 text-right font-mono text-sm font-semibold text-cyan-800">{formatXp(currentUser.xp)}</span>
                {typeof currentUser.dailyDelta === 'number' ? (
                  <span className="hidden sm:inline rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-700">
                    +{currentUser.dailyDelta} today
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
