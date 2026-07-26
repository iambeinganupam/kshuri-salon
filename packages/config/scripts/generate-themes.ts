#!/usr/bin/env tsx
/**
 * Design-token codegen — converts `design-tokens.ts` into per-audience CSS
 * files for web apps to `@import`. Mobile apps read the TS module directly
 * via NativeWind, so they don't need this step.
 *
 * Workflow (production-grade):
 *   • TypeScript module = single source of truth.
 *   • Generated `.css` files are committed for fast bundler imports.
 *   • `npm run gen:themes` regenerates after every edit to design-tokens.ts.
 *   • `npm run check:themes` regenerates in-memory and diffs vs. committed
 *     files — CI uses this to fail builds when tokens.ts and committed CSS
 *     drift. Mirrors the Vercel/Linear/Shopify-Polaris token pipeline.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { themes, scaleToCssVars, type ColorScale } from "../design-tokens";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "themes");
const HEADER = `/*
 * AUTO-GENERATED FROM packages/config/design-tokens.ts
 * Do not edit by hand. Run \`npm run gen:themes\` to regenerate.
 *
 * To change a token value, edit \`design-tokens.ts\` and re-run the generator.
 */
`;

function indent(map: Record<string, string>, spaces: number): string {
  const pad = " ".repeat(spaces);
  return Object.entries(map)
    .map(([k, v]) => `${pad}${k}: ${v};`)
    .join("\n");
}

function renderCss(
  light: ColorScale,
  dark: ColorScale,
  radiusRem: number,
): string {
  const lightVars = scaleToCssVars(light);
  const darkVars = scaleToCssVars(dark);
  // Radius is shared across modes — emit once in :root.
  const radiusLine = `    --radius: ${radiusRem}rem;`;
  return `${HEADER}
@layer base {
  :root {
${radiusLine}
${indent(lightVars, 4)}
  }

  .dark {
${indent(darkVars, 4)}
  }
}
`;
}

interface RunOptions {
  /** When true, compares against committed files and exits non-zero on drift. */
  checkOnly?: boolean;
}

function run({ checkOnly = false }: RunOptions): void {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  let driftDetected = false;

  for (const [audience, theme] of Object.entries(themes)) {
    const css = renderCss(theme.light, theme.dark, theme.radius);
    const outPath = join(OUT_DIR, `${audience}.css`);

    if (checkOnly) {
      const existing = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";
      if (existing !== css) {
        driftDetected = true;
        console.error(`[design-tokens] DRIFT in ${outPath}`);
        console.error(
          `  Committed CSS does not match design-tokens.ts. Run \`npm run gen:themes\` and commit the result.`,
        );
      } else {
        console.log(`[design-tokens] OK ${audience}.css`);
      }
    } else {
      writeFileSync(outPath, css, "utf8");
      console.log(`[design-tokens] wrote ${outPath}`);
    }
  }

  if (driftDetected) process.exit(1);
}

const checkOnly = process.argv.includes("--check");
run({ checkOnly });
