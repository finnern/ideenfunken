type HeroSlimProps = {
  remainingVotes: number;
  onSuggestClick?: () => void;
};

export default function HeroSlim({ remainingVotes, onSuggestClick }: HeroSlimProps) {
  return (
    <section
      className="w-full bg-yellow-400/80 text-black border-b border-yellow-500"
      aria-label="Projektübersicht"
    >
      <div className="mx-auto max-w-6xl px-4 py-3 md:py-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight leading-tight">
            IDEENFUNKEN – Schrambergs kreative Lesewelt
          </h1>

          <p
            className="text-sm md:text-base leading-tight line-clamp-2"
            style={{ maxHeight: 52, overflow: "hidden" }}
          >
            Gemeinsam wählen wir Bücher, die uns innovativer, kreativer und besser gemacht haben –{" "}
            <strong>die Top&nbsp;10 spendet die Mediathek für alle.</strong>
          </p>

          {/* Inline chips (single row on desktop, wraps on mobile) */}
          <ul className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
            <li className="flex flex-col gap-1">
              <span className="px-2.5 py-1 rounded-full bg-white/80 border border-yellow-500">
                Einfach Bücher Vorschlagen
              </span>
              <button
                onClick={onSuggestClick}
                className="text-xs underline font-medium decoration-1 underline-offset-2 hover:opacity-80 transition-opacity text-left"
                type="button"
              >
                Buch vorschlagen
              </button>
            </li>
            <li className="px-2.5 py-1 rounded-full bg-white/80 border border-yellow-500">
              Abstimmen (5 Stimmen)
            </li>
            <li className="px-2.5 py-1 rounded-full bg-white/80 border border-yellow-500">
              Top&nbsp;10 → Mediathek
            </li>

            {/* Right-aligned vote counter */}
            <li className="ms-auto">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-black/20 bg-black/5"
                aria-live="polite"
                title="Verbleibende Stimmen"
              >
                Noch <strong className="tabular-nums">{remainingVotes}</strong> / 5&nbsp;Stimmen
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}