import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    TanStackRouterVite({ target: "react" }),
    react(),
    tailwindcss()
  ],
  server: {
    port: 8080,
    proxy: {
      "/api/chat": {
        target: "http://localhost:5000/api/agent/chat",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chat/, "")
      }
    }
  }
});
