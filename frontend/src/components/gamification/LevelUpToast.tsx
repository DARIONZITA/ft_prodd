import { useEffect, useState } from 'react';
import { Sparkles, Trophy, X } from 'lucide-react';

interface LevelUpToastProps {
  open: boolean;
  onClose: () => void;
  previousLevel: number;
  newLevel: number;
  currentXp: number;
  nextLevelXp: number;
  unlockedBadgeName?: string;
}

export default function LevelUpToast({
  open,
  onClose,
  previousLevel,
  newLevel,
  currentXp,
  nextLevelXp,
  unlockedBadgeName,
}: LevelUpToastProps) {
  const [countdownWidth, setCountdownWidth] = useState(100);

  useEffect(() => {
    if (!open) return;

    setCountdownWidth(100);
    const rafId = window.requestAnimationFrame(() => {
      setCountdownWidth(0);
    });

    const timeoutId = window.setTimeout(() => {
      onClose();
    }, 4000);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [open, onClose]);

  if (!open) return null;

  const safeXpTarget = Math.max(nextLevelXp, 1);
  const progressPercent = Math.max(0, Math.min(100, Math.round((currentXp / safeXpTarget) * 100)));

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-[91] w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-cyan-400 via-indigo-500 to-cyan-400" />

        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close level up toast"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-7 pb-7 pt-8 text-center">
          <div className="mx-auto mb-2 flex w-fit items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
            <Sparkles className="h-3 w-3" />
            Level up
          </div>

          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-lg ring-4 ring-cyan-100">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wide text-cyan-100">level</p>
              <p className="font-display text-4xl font-black leading-none text-white">{newLevel}</p>
            </div>
          </div>

          <h3 className="font-display text-2xl font-bold text-slate-900">You leveled up</h3>
          <p className="mt-1 text-sm text-slate-500">
            From level {previousLevel} to level {newLevel}. Keep it going.
          </p>

          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left">
            <div className="mb-2 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>LVL {newLevel}</span>
              <span>LVL {newLevel + 1}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              <span className="font-mono font-semibold text-cyan-700">{currentXp.toLocaleString()} XP</span>
              {' '}de{' '}
              <span className="font-mono">{nextLevelXp.toLocaleString()} XP</span>
            </p>
          </div>

          {unlockedBadgeName ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left">
              <Trophy className="mt-0.5 h-4 w-4 text-amber-600" />
              <div>
                <p className="text-xs font-semibold text-amber-900">New badge unlocked</p>
                <p className="text-xs text-amber-700">{unlockedBadgeName}</p>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
            >
              Continuar
            </button>
          </div>
        </div>

        <div className="h-1 w-full overflow-hidden bg-slate-100">
          <div className="h-full bg-cyan-500" style={{ width: `${countdownWidth}%`, transition: 'width 4s linear' }} />
        </div>
      </div>
    </div>
  );
}
