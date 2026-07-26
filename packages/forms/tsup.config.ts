import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: !process.env.VERCEL,
  external: ["react", "react-dom", "@kshuri/ui"],
  minify: true,
  clean: true,
});
