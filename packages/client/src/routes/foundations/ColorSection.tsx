import { Section, SpecLabel } from "./Section";
import { color, contrastRatio } from "../../design-system/tokens";

function Ratio({ fg, bg, vs }: { fg: string; bg: string; vs: string }) {
  const r = contrastRatio(fg, bg);
  return (
    <span className="font-mono text-micro text-ink-muted">
      {r.toFixed(2)}:1 <span className="text-ink-disabled">vs {vs}</span>
    </span>
  );
}

function Swatch({
  name,
  hex,
  role,
  ratios,
}: {
  name: string;
  hex: string;
  role: string;
  ratios?: Array<{ bg: string; vs: string }>;
}) {
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div
        className="h-14 rounded-tick border border-line-strong"
        style={{ backgroundColor: hex }}
      />
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-caption text-ink">{name}</span>
          <span className="font-mono text-micro text-ink-muted">{hex}</span>
        </div>
        <span className="text-micro text-ink-muted">{role}</span>
        {ratios?.map((r) => <Ratio key={r.vs} fg={hex} bg={r.bg} vs={r.vs} />)}
      </div>
    </div>
  );
}

export function ColorSection() {
  return (
    <Section
      id="color"
      index="01"
      title="Color"
      note="Three surface depths, four ink levels, one accent. Ratios are computed at render time from the token values — WCAG 2.1 AA requires 4.5:1 for text."
    >
      <div className="flex flex-col gap-10">
        <div>
          <SpecLabel>Surfaces</SpecLabel>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Swatch name="void" hex={color.void} role="Base layer. The room the console sits in." />
            <Swatch name="panel" hex={color.panel} role="Raised layer. Cards, feeds, tables." />
            <Swatch name="shelf" hex={color.shelf} role="Overlay layer. Menus, popovers, dialogs." />
          </div>
        </div>

        <div>
          <SpecLabel>Ink</SpecLabel>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Swatch
              name="ink"
              hex={color.ink}
              role="Primary text and data values."
              ratios={[
                { bg: color.void, vs: "void" },
                { bg: color.shelf, vs: "shelf" },
              ]}
            />
            <Swatch
              name="ink-secondary"
              hex={color.inkSecondary}
              role="Prose, descriptions, quieter values."
              ratios={[
                { bg: color.void, vs: "void" },
                { bg: color.shelf, vs: "shelf" },
              ]}
            />
            <Swatch
              name="ink-muted"
              hex={color.inkMuted}
              role="Labels, timestamps, metadata."
              ratios={[
                { bg: color.void, vs: "void" },
                { bg: color.shelf, vs: "shelf" },
              ]}
            />
            <Swatch
              name="ink-disabled"
              hex={color.inkDisabled}
              role="Disabled controls only — never information."
              ratios={[{ bg: color.void, vs: "void" }]}
            />
          </div>
        </div>

        <div>
          <SpecLabel>Lines &amp; accent</SpecLabel>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Swatch name="line" hex={color.line} role="Hairline borders at rest." />
            <Swatch name="line-strong" hex={color.lineStrong} role="Control borders, hover edges." />
            <Swatch
              name="trace"
              hex={color.trace}
              role="The accent. Focus, primary action, selection. Never decoration."
              ratios={[{ bg: color.void, vs: "void" }]}
            />
            <Swatch
              name="trace-dim"
              hex={color.traceDim}
              role="Accent at rest — focused borders, links, live markers."
              ratios={[{ bg: color.void, vs: "void" }]}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
