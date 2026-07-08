import type { ReactNode } from "react";

export function Section({
  id,
  index,
  title,
  note,
  children,
}: {
  id: string;
  index: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-12 border-t border-line pt-8 pb-20">
      <header className="mb-10 flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <span aria-hidden className="font-mono text-caption text-trace-dim">
          {index}
        </span>
        <h2
          id={`${id}-h`}
          className="font-mono text-title font-medium tracking-[0.04em] text-ink uppercase"
        >
          {title}
        </h2>
        {note ? <p className="max-w-xl text-caption text-ink-muted">{note}</p> : null}
      </header>
      {children}
    </section>
  );
}

export function SpecLabel({ children }: { children: ReactNode }) {
  return <span className="label-micro">{children}</span>;
}
