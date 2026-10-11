import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// A relative base lets the built app run from any folder, including a GitHub Pages subpath.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
});
