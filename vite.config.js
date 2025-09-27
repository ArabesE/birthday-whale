import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true, // listen on all addresses, so LAN devices can connect
    port: 5173,
    strictPort: false,
  },
});
