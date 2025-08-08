export default function AboutIdeenfunken() {
  return (
    <section className="mx-auto max-w-6xl px-4 my-8" aria-labelledby="about-title">
      <details className="group rounded-xl border bg-white/70 shadow-sm">
        <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between hover:bg-black/5 transition-colors">
          <h2 id="about-title" className="text-base md:text-lg font-semibold">
            Über IDEENFUNKEN
          </h2>
          <span className="text-sm opacity-70 group-open:rotate-180 transition-transform duration-200">
            ▼
          </span>
        </summary>

        <div className="px-4 pb-4 -mt-1 text-sm md:text-base leading-relaxed">
          <p className="mb-2">
            IDEENFUNKEN ist eine Gemeinschaftsaktion aus Schramberg: Wir sammeln die Bücher, die
            unser Denken verändert und unser Leben verbessert haben. Die{" "}
            <strong>Top&nbsp;10</strong> werden der Mediathek gespendet – damit alle profitieren.
          </p>
          <p className="mb-1">
            Möglich gemacht durch eine großzügige Unterstützung der{" "}
            <strong>Simon Gruppe</strong> in Aichhalden unter der{" "}
            <strong>Leadership von Tobias Hilgert</strong>. Vielen Dank!
          </p>
        </div>
      </details>
    </section>
  );
}