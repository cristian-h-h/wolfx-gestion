import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0", // Permite acceso desde la red local
    port: 8080,
    proxy: {
      // Proxy para redirigir llamadas API a un backend en Node/Express (si lo tienes)
      "/api": {
        target: "http://localhost:3001", // Cambia este puerto al de tu backend real
        changeOrigin: true,
        secure: false,
        ws: true, // Soporte para websockets si tu backend los usa
      },
    },
    strictPort: true, // Falla si el puerto 8080 está ocupado, útil para evitar confusiones
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
