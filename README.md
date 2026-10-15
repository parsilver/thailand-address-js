# thailand-address-js

The frontend for the [Thai address dataset](https://data.farzai.com/thailand-address/llms-full.txt).

| Path | What |
|---|---|
| [`packages/core`](packages/core) | `@farzai/thailand-address`, typed lazy lookups (npm) |
| [`registry`](registry) | the shadcn/ui `address-form` registry item |
| [`apps/demo`](apps/demo) | demo, docs and registry host at https://thailand-address-demo.farzai.com |
| [`docs/design`](docs/design) | design brief, copy, screens and prototype for issue #1 |

## Develop

Node 22 and pnpm (the version is pinned in `packageManager`).

```sh
pnpm install
pnpm test        # unit tests on a trimmed copy of the real snapshot
pnpm lint && pnpm typecheck && pnpm build
pnpm --filter @farzai/thailand-address test:live   # the same cases against data.farzai.com
```

`packages/core/test/fixtures/snapshot` is cut from the pinned snapshot by `packages/core/scripts/make-fixtures.mjs`.

## Release

Pushing a tag `vX.Y.Z` that equals `packages/core/package.json`'s version publishes the core package to npm with provenance (`.github/workflows/release.yml`).
