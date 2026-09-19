import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages 把项目挂在 https://<用户名>.github.io/<仓库名>/ 下，
// 部署时要带上仓库名前缀；本地开发与 Sites 构建保持根路径。
const base = process.env.VITE_BASE || "/";

export default defineConfig({
  base,
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react()],
});
