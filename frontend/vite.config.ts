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
    port: 8080
  }
});
