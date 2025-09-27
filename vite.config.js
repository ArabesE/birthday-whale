import { defineConfig } from "vite";

export default defineConfig({
  // Base URL for GitHub Pages project site: https://<user>.github.io/birthday-whale/
  // Adjust if deploying to a different repository or a custom domain.
  base: "/birthday-whale/",
  server: {
    host: true, // listen on all addresses, so LAN devices can connect
    port: 5173,
    strictPort: false,
  },
});
