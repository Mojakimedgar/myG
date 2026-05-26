// @ts-nocheck
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Try importing lovable-tagger safely
let componentTagger;
try {
  componentTagger = require("lovable-tagger").componentTagger;
} catch (e) {
  console.warn(
    "lovable-tagger not installed or failed to load. Skipping componentTagger plugin."
  );
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,       // bind to all interfaces (IPv4 + IPv6) for localhost and LAN
    port: 8085,       // dev server port
    strictPort: true, // fail if port is already in use
    allowedHosts: [
      "all",
      "localhost",
      "127.0.0.1",
      "e4500825722f.ngrok-free.app"
    ],
    proxy: {
      "/api/nominatim": {
        target: "https://nominatim.openstreetmap.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nominatim/, ""),
        headers: { "User-Agent": "MyG-Family-Safety/1.0" },
      },
    },
  },
  preview: {
    port: 8085,
    proxy: {
      "/api/nominatim": {
        target: "https://nominatim.openstreetmap.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nominatim/, ""),
        headers: { "User-Agent": "MyG-Family-Safety/1.0" },
      },
    },
  },
  plugins: [
    react(),
    // Only use componentTagger in development if available
    mode === "development" && componentTagger && componentTagger()
  ].filter(Boolean),
  resolve: {
    // Prefer .ts/.tsx over compiled .js duplicates in src (fixes stale modules)
    extensions: [".mjs", ".tsx", ".ts", ".jsx", ".js", ".json"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
  },
}));