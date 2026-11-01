import { defineConfig } from "vite";

export default defineConfig({
  base: "/bonbondrop-wasm/",
  server: {
    fs: {
      allow: [".."],
    },
  },
  optimizeDeps: {
    exclude: ["bonbondrop"],
  },
});
