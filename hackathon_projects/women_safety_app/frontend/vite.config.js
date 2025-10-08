import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["@react-google-maps/api"],
  },
  build: {
    target: ["es2020", "chrome90", "safari15"],
  },
});
