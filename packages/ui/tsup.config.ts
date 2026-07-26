import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: !process.env.VERCEL,
  external: [
    "react",
    "react-dom",
    // Externalised peer deps — never bundle these. A second copy creates a
    // separate React context and breaks consumers (e.g. <FormProvider> in
    // @kshuri/ui not seen by useFormContext() in @kshuri/forms).
    "react-hook-form",
    "react-error-boundary",
    "zod",
    "@tanstack/react-query",
  ],
  minify: true,
  clean: true,
});
