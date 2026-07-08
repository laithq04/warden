import type { ParserName } from "../parsers/types.js";

export interface ScenarioEvent {
  parser: ParserName;
  event: unknown;
  delayMs: number;
}

export interface Scenario {
  name: string;
  description: string;
  build(base: Date): ScenarioEvent[];
}
