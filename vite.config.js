import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Enable history API fallback for client-side routing
    historyApiFallback: true,
  },
  preview: {
    // Enable history API fallback for preview mode as well
    historyApiFallback: true,
  },
});
