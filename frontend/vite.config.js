import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    port: 6200,
    proxy: {
      "/api": {
        target: "http://localhost:6000",
        changeOrigin: true
      },
      "/Payment": {
        target: "http://localhost:6000",
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: "dist",
    sourcemap: false
  }
});