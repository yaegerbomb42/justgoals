// vite.config.mjs
import { defineConfig } from "file:///Users/yaeger/justgoals/node_modules/vite/dist/node/index.js";
import react from "file:///Users/yaeger/justgoals/node_modules/@vitejs/plugin-react/dist/index.mjs";
import tsconfigPaths from "file:///Users/yaeger/justgoals/node_modules/vite-tsconfig-paths/dist/index.mjs";
import tagger from "file:///Users/yaeger/justgoals/node_modules/@dhiwise/component-tagger/dist/index.mjs";
var vite_config_default = defineConfig({
  // This changes the out put dir from dist to build
  // comment this out if that isn't relevant for your project
  // build: {
  //   outDir: "build", // Default is 'dist'
  //   chunkSizeWarningLimit: 2000,
  // },
  plugins: [tsconfigPaths(), react(), tagger()],
  server: {
    port: "4028",
    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: [".amazonaws.com", ".builtwithrocket.new"],
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3lhZWdlci9qdXN0Z29hbHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy95YWVnZXIvanVzdGdvYWxzL3ZpdGUuY29uZmlnLm1qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMveWFlZ2VyL2p1c3Rnb2Fscy92aXRlLmNvbmZpZy5tanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSBcInZpdGUtdHNjb25maWctcGF0aHNcIjtcbmltcG9ydCB0YWdnZXIgZnJvbSBcIkBkaGl3aXNlL2NvbXBvbmVudC10YWdnZXJcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIC8vIFRoaXMgY2hhbmdlcyB0aGUgb3V0IHB1dCBkaXIgZnJvbSBkaXN0IHRvIGJ1aWxkXG4gIC8vIGNvbW1lbnQgdGhpcyBvdXQgaWYgdGhhdCBpc24ndCByZWxldmFudCBmb3IgeW91ciBwcm9qZWN0XG4gIC8vIGJ1aWxkOiB7XG4gIC8vICAgb3V0RGlyOiBcImJ1aWxkXCIsIC8vIERlZmF1bHQgaXMgJ2Rpc3QnXG4gIC8vICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAyMDAwLFxuICAvLyB9LFxuICBwbHVnaW5zOiBbdHNjb25maWdQYXRocygpLCByZWFjdCgpLCB0YWdnZXIoKV0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IFwiNDAyOFwiLFxuICAgIGhvc3Q6IFwiMC4wLjAuMFwiLFxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgYWxsb3dlZEhvc3RzOiBbJy5hbWF6b25hd3MuY29tJywgJy5idWlsdHdpdGhyb2NrZXQubmV3J10sXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnJylcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVAsU0FBUyxvQkFBb0I7QUFDdFIsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sbUJBQW1CO0FBQzFCLE9BQU8sWUFBWTtBQUduQixJQUFPLHNCQUFRLGFBQWE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU8xQixTQUFTLENBQUMsY0FBYyxHQUFHLE1BQU0sR0FBRyxPQUFPLENBQUM7QUFBQSxFQUM1QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixjQUFjLENBQUMsa0JBQWtCLHNCQUFzQjtBQUFBLElBQ3ZELE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQyxTQUFTLEtBQUssUUFBUSxVQUFVLEVBQUU7QUFBQSxNQUM5QztBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
