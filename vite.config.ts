import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(() => {
  const disableHmr = process.env.DISABLE_HMR === "true";

  return {
    base: "./",
    plugins: [react(), tailwindcss()],
    build: {
      outDir: "docs",
      emptyOutDir: true
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, ".")
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR to reduce flicker during agent edits.
      hmr: !disableHmr,
      watch: disableHmr ? null : {}
    }
  };
});
