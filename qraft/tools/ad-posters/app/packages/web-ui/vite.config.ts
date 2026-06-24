import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react() as never],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5176,
    proxy: {
      "/api": "http://127.0.0.1:3466",
      "/preview": "http://127.0.0.1:3466",
      "/campaign-assets": "http://127.0.0.1:3466",
      "/events": {
        target: "ws://127.0.0.1:3466",
        ws: true,
      },
    },
  },
});
