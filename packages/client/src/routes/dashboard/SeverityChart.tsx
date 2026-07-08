import { useMemo } from "react";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";
import { severities, severity as severityTokens } from "../../design-system/tokens";
import type { Alert } from "../../lib/types";

const width = 400;
const height = 180;
const margin = { top: 8, right: 8, bottom: 24, left: 8 };

export function SeverityChart({ alerts }: { alerts: Alert[] }) {
  const counts = useMemo(() => {
    const tally = Object.fromEntries(severities.map((s) => [s, 0])) as Record<
      (typeof severities)[number],
      number
    >;
    for (const alert of alerts) tally[alert.severity]++;
    return tally;
  }, [alerts]);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const maxCount = Math.max(1, ...severities.map((s) => counts[s]));

  const xScale = scaleBand<string>({
    domain: severities as unknown as string[],
    range: [0, innerWidth],
    padding: 0.35,
  });
  const yScale = scaleLinear<number>({
    domain: [0, maxCount],
    range: [innerHeight, 0],
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label={`Alert counts by severity: ${severities
        .map((s) => `${s} ${counts[s]}`)
        .join(", ")}`}
    >
      <Group left={margin.left} top={margin.top}>
        {severities.map((sev) => {
          const count = counts[sev];
          const barHeight = innerHeight - yScale(count);
          const barX = xScale(sev) ?? 0;
          const barWidth = xScale.bandwidth();
          const s = severityTokens[sev];
          return (
            <Group key={sev}>
              <Bar
                x={barX}
                y={innerHeight - barHeight}
                width={barWidth}
                height={Math.max(barHeight, count > 0 ? 2 : 0)}
                fill={s.base}
                rx={2}
              />
              <text
                x={barX + barWidth / 2}
                y={innerHeight + 16}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={9}
                letterSpacing="0.06em"
                fill="var(--color-ink-muted)"
              >
                {s.label}
              </text>
              <text
                x={barX + barWidth / 2}
                y={innerHeight - barHeight - 6}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={11}
                fill="var(--color-ink-secondary)"
              >
                {count}
              </text>
            </Group>
          );
        })}
      </Group>
    </svg>
  );
}
