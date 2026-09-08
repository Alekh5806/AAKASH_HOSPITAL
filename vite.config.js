import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Bind to every interface so a real phone on the same Wi-Fi can open the
    // Network URL that `npm run dev` prints. Dev only; does not affect builds.
    host: true,
  },
  build: {
    sourcemap: false,
  },
});
