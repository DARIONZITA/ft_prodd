import { useMemo, useState } from 'react';
import { Lock, Sparkles, X } from 'lucide-react';
import type { BadgeCategory, BadgeItem } from '../../components/gamification/Types';

interface BadgesPageProps {
  badges: BadgeItem[];
  onOpenLeaderboard: () => void;
  onShowLevelUp: () => void;
}

const categoryLabels: Record<'all' | BadgeCategory, string> = {
  all: 'All',
  tasks: 'Tasks',
  collaboration: 'Collaboration',
  streaks: 'Streaks',
  milestones: 'Milestones',
};

export default function BadgesPage({ badges, onOpenLeaderboard, onShowLevelUp }: BadgesPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | BadgeCategory>('all');
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  const filteredBadges = useMemo(() => {
    if (selectedCategory === 'all') return badges;
    return badges.filter((badge) => badge.category === selectedCategory);
  }, [badges, selectedCategory]);

  const earnedBadges = badges.filter((badge) => !!badge.earnedAt);
  const lockedBadges = badges.filter((badge) => !badge.earnedAt);
  const newBadges = badges.filter((badge) => !!badge.isNew && !!badge.earnedAt);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">Badges</h1>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{earnedBadges.length}</span> earned ·{' '}
              <span className="font-semibold text-slate-400">{lockedBadges.length}</span> locked ·{' '}
              <span className="font-semibold text-cyan-700">{newBadges.length}</span> new
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenLeaderboard}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-cyan-300 hover:text-cyan-700"
            >
              Open leaderboard
            </button>
            <button
              onClick={onShowLevelUp}
              className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-cyan-700"
            >
              Simulate level up
            </button>
          </div>
        </div>

        <div className="mb-7 flex flex-wrap gap-2">
          {(Object.keys(categoryLabels) as Array<'all' | BadgeCategory>).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'border-cyan-600 bg-cyan-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700'
              }`}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>

        <div className="mb-10">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-slate-400">Earned</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {filteredBadges
              .filter((badge) => !!badge.earnedAt)
              .map((badge) => (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`group relative rounded-2xl border bg-white p-4 text-center shadow-sm transition-transform hover:-translate-y-1 ${
                    badge.isNew ? 'border-cyan-300 ring-2 ring-cyan-100' : 'border-slate-200 hover:border-cyan-200'
                  }`}
                >
                  {badge.isNew ? (
                    <span className="absolute -right-2 -top-2 rounded-full bg-cyan-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      NEW
                    </span>
                  ) : null}
                  <div className="text-4xl">{badge.icon}</div>
                  <p className="mt-2 text-xs font-semibold text-slate-800">{badge.name}</p>
                  <span className="mt-2 inline-block rounded-full bg-cyan-50 px-2 py-0.5 font-mono text-[10px] text-cyan-700">+{badge.xpReward} XP</span>
                </button>
              ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-slate-400">Locked</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {filteredBadges
              .filter((badge) => !badge.earnedAt)
              .map((badge) => {
                const hasProgress = typeof badge.progressCurrent === 'number' && typeof badge.progressTotal === 'number' && badge.progressTotal > 0;
                const progressPercent = hasProgress
                  ? Math.max(0, Math.min(100, Math.round((badge.progressCurrent! / badge.progressTotal!) * 100)))
                  : 0;

                return (
                  <div key={badge.id} className="rounded-2xl border border-slate-100 bg-white p-4 opacity-60">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="text-4xl grayscale">{badge.icon}</div>
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="text-xs font-semibold text-slate-500">{badge.name}</p>
                    {hasProgress ? (
                      <div className="mt-2">
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-slate-400" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <p className="mt-1 font-mono text-[10px] text-slate-400">
                          {badge.progressCurrent} / {badge.progressTotal}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 font-mono text-[10px] text-slate-400">Locked</p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {selectedBadge ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedBadge(null)} />
          <div className="relative z-[81] w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl">
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close badge details"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-6xl">{selectedBadge.icon}</div>
            <h3 className="mt-3 font-display text-2xl font-bold text-slate-900">{selectedBadge.name}</h3>
            <p className="mt-2 text-sm text-slate-500">{selectedBadge.description}</p>

            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 font-mono text-xs font-semibold text-cyan-700">
                +{selectedBadge.xpReward} XP
              </span>
              {selectedBadge.isNew ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  <Sparkles className="h-3 w-3" />
                  New
                </span>
              ) : null}
            </div>

            {selectedBadge.earnedAt ? (
              <p className="mt-4 font-mono text-xs text-slate-400">Earned on {selectedBadge.earnedAt}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
