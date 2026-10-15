# apps/demo

The demo, docs and shadcn registry host at https://thailand-address-demo.farzai.com. It's a Vite + React app served as Cloudflare Workers static assets, with no Worker script.

- It builds the registry item from `../../registry/src/registry` the way an install would, through the `@/registry/*` alias.
- `scripts/copy-registry.mjs` copies the built `registry/public/r/*.json` into `public/r`, so the install URL is `/r/address-form.json`.
- `public/_headers` sets the CSP and the other security headers. `connect-src` allows only `self` and `https://data.farzai.com`. `/r/*` is served as JSON with CORS open.
- `public/llms.txt` describes the component and core package for LLMs.

```sh
pnpm --filter @thailand-address/demo dev        # http://localhost:5173
pnpm --filter @thailand-address/demo test       # every sidebar page renders; payload views
pnpm --filter @thailand-address/demo build      # dist/
pnpm --filter @thailand-address/demo exec wrangler dev     # dist/ with _headers and SPA fallback, as Cloudflare serves it
```

## Deploy (Personal Lead)

```sh
pnpm --filter @thailand-address/demo deploy     # pnpm build && wrangler deploy
```

`wrangler.jsonc` deploys the Worker `thailand-address-demo` with the custom domain `thailand-address-demo.farzai.com`. Never use `thailand-address.farzai.com`, which is reserved. To roll back, run `wrangler rollback` or pick the previous deployment in the dashboard.
