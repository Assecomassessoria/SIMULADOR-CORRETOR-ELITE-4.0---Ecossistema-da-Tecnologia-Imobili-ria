import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/functions/v1": {
        target: "https://hoagdvthplzbmqrvuesi.supabase.co",
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("origin", "https://simuladorcorretorelite.com.br");
          });
        }
      },
      "/rest/v1": {
        target: "https://hoagdvthplzbmqrvuesi.supabase.co",
        changeOrigin: true,
      },
      "/auth/v1": {
        target: "https://hoagdvthplzbmqrvuesi.supabase.co",
        changeOrigin: true,
      },
      "/storage/v1": {
        target: "https://hoagdvthplzbmqrvuesi.supabase.co",
        changeOrigin: true,
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["app-icon.ico", "pwa-icon-192.png", "pwa-icon-512.png"],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      manifest: {
        name: "Simulador Corretor de Elite 4.0",
        short_name: "Elite 4.0",
        description: "Simulador Corretor de Elite 4.0 - Vendas Seguras",
        theme_color: "#001F3F",
        background_color: "#001F3F",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/pwa-icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
