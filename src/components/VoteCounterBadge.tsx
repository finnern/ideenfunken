export function VoteCounterBadge({ remaining }: { remaining: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-black/20 bg-black/5 text-xs md:text-sm"
      aria-live="polite"
      title="Verbleibende Stimmen"
    >
      Noch <strong className="tabular-nums">{remaining}</strong> / 5&nbsp;Stimmen
    </span>
  );
}