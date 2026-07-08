export const color = {
  void: "#0a0e13",
  panel: "#11161d",
  shelf: "#171e27",
  ink: "#e8f0f2",
  inkSecondary: "#a9bac3",
  inkMuted: "#76909c",
  inkDisabled: "#4a5a64",
  line: "#1e2833",
  lineStrong: "#2c3947",
  trace: "#8fe6d0",
  traceDim: "#4fbfa9",
} as const;

export const severities = ["info", "low", "medium", "high", "critical"] as const;
export type Severity = (typeof severities)[number];

export const severity: Record<Severity, { base: string; bright: string; label: string }> = {
  info: { base: "#7fa8d6", bright: "#a9c8e8", label: "INFO" },
  low: { base: "#57c08a", bright: "#8cdcb2", label: "LOW" },
  medium: { base: "#e0b33f", bright: "#efcc72", label: "MED" },
  high: { base: "#f28749", bright: "#ffab7d", label: "HIGH" },
  critical: { base: "#ff5c64", bright: "#ff959b", label: "CRIT" },
};

export const duration = {
  instant: 0.08,
  fast: 0.14,
  base: 0.22,
  slow: 0.4,
  decay: 1.2,
} as const;

export const ease = {
  snap: [0.3, 0, 0, 1],
  settle: [0.22, 1, 0.36, 1],
  decay: [0.05, 0.7, 0.1, 1],
} as const satisfies Record<string, [number, number, number, number]>;

export const stagger = {
  listStep: 0.04,
  listCap: 6,
} as const;

export function contrastRatio(fg: string, bg: string): number {
  const channel = (hex: string, i: number) =>
    parseInt(hex.replace("#", "").slice(i * 2, i * 2 + 2), 16) / 255;
  const lum = (hex: string) => {
    const f = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(channel(hex, 0)) + 0.7152 * f(channel(hex, 1)) + 0.0722 * f(channel(hex, 2));
  };
  const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
