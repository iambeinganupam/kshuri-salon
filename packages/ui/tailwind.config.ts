/** @type {import('tailwindcss').Config} */
import sharedConfig from "@barber/config/tailwind-preset.ts";

export default {
  ...sharedConfig,
  content: [
    "./src/**/*.{ts,tsx}",
  ],
};
