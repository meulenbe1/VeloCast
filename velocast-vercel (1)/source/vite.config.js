import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base = "/velocast/" zodat GitHub Pages de bestanden vindt.
// Publiceer je onder een eigen domein of via Netlify/Vercel? Zet base dan op "/".
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === "true" ? "/velocast/" : "/",
});
