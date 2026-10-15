import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
      // Develop against the workspace source; installs get the npm package.
      "@farzai/thailand-address": resolve(
        import.meta.dirname,
        "../packages/core/src/index.ts"
      ),
    },
  },
})
