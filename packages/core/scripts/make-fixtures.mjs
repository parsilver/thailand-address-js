// Cuts a small, real fixture dataset out of a downloaded snapshot, for tests.
// Usage: node scripts/make-fixtures.mjs <dir-with-snapshot-files>
// The dir holds provinces.json, districts.json, subdistricts.json and
// index/postal_codes.json, plus by-province/<code>.json for each kept province.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const src = process.argv[2]
if (!src) throw new Error('usage: make-fixtures.mjs <snapshot-dir>')
const out = join(dirname(fileURLToPath(import.meta.url)), '../test/fixtures/snapshot')
// Bangkok, Samut Prakan (10001), Nonthaburi, Ayutthaya + Lop Buri (13240),
// Phuket (83100), Trang (another Bang Rak).
const PROVINCES = ['10', '11', '12', '14', '16', '83', '92']
const keep = (code) => PROVINCES.includes(code.slice(0, 2))
const read = (p) => JSON.parse(readFileSync(join(src, p), 'utf8'))
const write = (p, v) => {
  mkdirSync(dirname(join(out, p)), { recursive: true })
  writeFileSync(join(out, p), JSON.stringify(v))
}

for (const f of ['provinces.json', 'districts.json', 'subdistricts.json']) {
  const env = read(f)
  write(f, { ...env, data: env.data.filter((r) => keep(r.code)) })
}
const idx = read('index/postal_codes.json')
write('index/postal_codes.json', {
  ...idx,
  data: idx.data
    .map((e) => ({ ...e, subdistricts: e.subdistricts.filter((s) => keep(s.code)) }))
    .filter((e) => e.subdistricts.length > 0),
})
for (const p of PROVINCES) write(`by-province/${p}.json`, read(`by-province/${p}.json`))
console.log(`fixtures written to ${out}`)
