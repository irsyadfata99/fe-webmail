import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  server: {
    port: 5173,
    // Saat pengembangan, /api diteruskan ke backend lokal. Browser hanya bicara ke
    // localhost:5173, jadi cookie sesi dan token CSRF jalan tanpa urusan CORS.
    proxy: {
      "/api": { target: "http://localhost:3000" },
    },
  },
});
