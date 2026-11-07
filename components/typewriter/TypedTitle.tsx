/** A line that appears letter by letter, as if typed — CSS only. */
export function TypedTitle({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  return (
    <p className={className} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="tw-typed-ch"
          style={{ animationDelay: `${delay + i * 55 + (ch === " " ? 40 : 0)}ms` }}
        >
          {ch}
        </span>
      ))}
    </p>
  );
}
