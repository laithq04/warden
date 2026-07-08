import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { ruleSchema, type Rule } from "./schema.js";

export function loadRules(rulesDir: string): Rule[] {
  const files = readdirSync(rulesDir)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .sort();

  return files.map((file) => {
    const fullPath = path.join(rulesDir, file);
    const doc: unknown = parseYaml(readFileSync(fullPath, "utf8"));
    const result = ruleSchema.safeParse(doc);
    if (!result.success) {
      throw new Error(`invalid rule file ${fullPath}: ${result.error.message}`);
    }
    return result.data;
  });
}
