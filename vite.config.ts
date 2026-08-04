import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      // Point Vercel at a JavaScript runtime entry so the serverless function can import it without resolving TypeScript source files at runtime.
      server: { entry: "./src/server.js" },
    }),
    tsConfigPaths(),
    react(),
    tailwindcss(),
  ],
});
