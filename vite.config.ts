import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import "vite-ssg";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  optimizeDeps: {
    include: ["pinia-plugin-persistedstate"],
  },
  build: {
    rollupOptions: {
      output: {
        // Use default chunking strategy to avoid circular dependency issues found in production builds
      },
    },
  },
  ssgOptions: {
    script: "async",
    formatting: "minify",
  },
});
