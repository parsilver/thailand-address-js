# @farzai/thailand-address

Typed, lazy lookups for the [Thai address dataset](https://data.farzai.com/thailand-address/llms-full.txt): provinces, districts, subdistricts and postal codes, with Thai and English names. It works in browsers, Node 18+, Deno, Bun and Workers, and has no dependencies.

```sh
npm install @farzai/thailand-address
```

```ts
import { createThaiAddress, formatAddress } from '@farzai/thailand-address'

const ta = createThaiAddress()

const r = await ta.lookupPostalCode('83100')
if (r.status === 'found' && r.shape === 'single') {
  const area = r.areas[0]
  formatAddress(area, 'th', r.postal_code) // "ตำบลกะรน อำเภอเมืองภูเก็ต จังหวัดภูเก็ต 83100"
}
```

## Snapshot

Every version of this package pins one dataset snapshot (`SNAPSHOT`, currently `2026-10-15`). Snapshots never change once published, so a lookup gives the same answer every time. A new snapshot ships as a new package version. The package never reads `latest.json`.

The files are fetched from `https://data.farzai.com/thailand-address/v1/<snapshot>/` on first use and kept in memory for the client's lifetime:

| Call | Loads |
|---|---|
| `provinces()` | `provinces.json` (2 KB compressed) |
| `districts()`, `subdistricts()`, `resolve()`, `postalCodesOf()` | `by-province/<code>.json` for that province |
| `lookupPostalCode()` | `index/postal_codes.json` (27 KB), then the provinces the code touches |
| `search()` | `districts.json` and `subdistricts.json` (about 170 KB), once |

## API

`createThaiAddress(options?)` returns a client:

- **Options:**
  - `baseUrl`: the dataset location.
  - `snapshot`: a pinned id, never `latest`.
  - `fetch`: a fetch implementation to use instead of the global one.
  - `includeFacilityCodes`: defaults to `false`.

- **Area cascade:**
  - `provinces()`: the active provinces.
  - `districts(provinceCode)`: the active districts of a province.
  - `subdistricts(districtCode)`: the active subdistricts of a district.
  - `resolve(subdistrictCode)`: the subdistrict with its district and province, or `null`.
- **`postalCodesOf(subdistrictCode, { includeFacility? })`:** the active postal codes of a subdistrict, each with `kind`, `coverage` and `note`. A subdistrict can have several, for example Ko Kaeo (83000 and 83200). When it does, let the user choose; never pick one.
- **`lookupPostalCode(input, { includeFacility? })`:** the input is normalised first (Thai digits are converted, and anything else that isn't a digit is dropped). It returns one of:
  - `incomplete`: fewer than 5 digits.
  - `not_found`.
  - `facility`: only mail-centre links use the code, for example 10001. The result includes the facility's `note`.
  - `found`, with a `shape`:
    - `single`: one subdistrict.
    - `one_district`: several subdistricts in one district, for example 10200.
    - `several_districts`: the code spans districts or provinces, for example 13240. `province_count` and `district_count` say how many.
- **`search(query, { limit?, includeFacility? })`:** matches Thai and English names.
  - Case, spaces and the prefixes ต./อ./จ./ตำบล/อำเภอ/จังหวัด/เขต/แขวง are ignored.
  - Digits match postal codes by prefix.
  - A search runs from 2 letters or 3 digits.
  - Each hit has a `level`. A province or district name gives that province or district once (`level: 'province'` or `'district'`), not every subdistrict in it. A subdistrict gives one hit per postal code.
  - Every word must match, and a hit scores by its weakest word. The whole query without spaces is tried too, so names typed as written ("bang rak", "Mueang Phuket") match exactly.
  - Exact matches come before prefix matches, which come before substring matches. Among exact matches, the higher level wins: "chiang mai" gives the province before the subdistrict of that name in Roi Et. Among prefix and substring matches, subdistricts come before districts, which come before provinces.
  - Each hit carries the character ranges that matched, for highlighting.
- **`validate({ province_code, district_code, subdistrict_code, postal_code })`:** checks the same things as the Laravel package's `thai_province`, `thai_district`, `thai_subdistrict` and `thai_postal_code` rules. Errors are `required`, `unknown` or `mismatch`.

`formatAddress(area, locale, postalCode?)` gives the one-line form:
- Bangkok: `แขวง… เขต… กรุงเทพมหานคร`.
- Other provinces: `ตำบล… อำเภอ… จังหวัด…`.
- English: `…, …, …`.

## Contract

The library follows the dataset's rules:
- **Codes are strings.**
- **Only `active` areas and links are used.**
- **Facility codes are hidden by default.**
- **Unknown fields and languages are ignored.** Fields, name languages and enum values the package doesn't know are left out. A kind it doesn't know reads as `null`, and a link with an unknown kind or status is not used.
- **No guessed postal codes.** A postal code is never derived from a district or province code.
- **Failed fetches throw.** A file that fails to load, belongs to another snapshot, or has a different schema major throws a `DatasetError` with a `code`. The next call fetches it again.

Types for the raw files are generated from the snapshot's `schema.json` (`pnpm gen:types`) and exported as `wire`.

## Privacy

The visitor's browser fetches the dataset files from data.farzai.com. The host sees the visitor's IP address and which `by-province/<code>.json` file was requested, so it learns the province being entered. The files are fetched without cookies and with `referrerPolicy: 'no-referrer'`, so the host doesn't learn which page asked.

To keep all of that on your own origin, copy the snapshot's files to your own host. Then pass `createThaiAddress({ baseUrl: 'https://your.host/thailand-address/v1' })` and allow only that origin in your CSP `connect-src`.

## Data sources

The data is derived from DOPA (ทำเนียบท้องที่), Thailand Post, and MDES's post-office dataset on data.go.th (CC-BY), with ISO 3166-2 codes from Debian iso-codes. Full attribution is in [the dataset docs](https://data.farzai.com/thailand-address/llms-full.txt).

MIT licence for the code.
