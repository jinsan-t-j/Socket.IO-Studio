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
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("socket.io-client")) return "socket";
            if (id.includes("vue") || id.includes("pinia") || id.includes("@vueuse")) return "vendor";
            return "deps";
          }
        },
      },
    },
  },
  ssgOptions: {
    script: "async",
    formatting: "minify",
  },
});
