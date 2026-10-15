import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const root = resolve(import.meta.dirname, "../..")

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Fonts stay files: the CSP allows font-src 'self', not data: URLs.
  build: { assetsInlineLimit: 0 },
  resolve: {
    alias: [
      // The registry item, as shadcn would install it into this app.
      { find: /^@\/registry\//, replacement: `${root}/registry/src/registry/` },
      { find: /^@\//, replacement: `${resolve(import.meta.dirname, "src")}/` },
      // Workspace source; an install gets the npm package.
      { find: "@farzai/thailand-address", replacement: `${root}/packages/core/src/index.ts` },
    ],
  },
})
