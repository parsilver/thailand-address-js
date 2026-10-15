# Thai address form (`address-form`) and demo site: design brief

Product Design Lead, 2026-10-14, for parsilver/thailand-address-js#1. Frontend Engineer builds from this.

## Brief

- **Goal:** a shadcn/ui registry component that turns a Thai address into four codes
  (`province_code`, `district_code`, `subdistrict_code`, `postal_code`) with as little typing as
  possible, and a demo site that is also its docs and registry host.
- **Who uses it:**
  - developers who install it into their own shadcn apps;
  - the end users who fill in those apps' checkout and registration forms, often on a phone.
- **Primary task (end user):** type the postal code and get the rest filled in. When the code is
  ambiguous, make one clear choice. Never get stuck.
- **Constraints:**
  - Extend shadcn/ui defaults only (`Field`/`Label`, `Input`, `Popover` + `Command` combobox,
    `RadioGroup`, `ToggleGroup`, `Checkbox`, `Alert`, `Drawer`). Use the host's CSS variables and no
    new colours, radii, fonts or shadows, so it looks native in any shadcn theme, light or dark.
  - Data comes from the pinned dataset snapshot and is lazy-loaded.
  - Output is codes, never names.
  - Thai and English.
- **Acceptance:** every case in #1 behaves as specified below, and QA's Maestro flows pass for
  each.

**Signature choice:** the postal code comes first and *does the work*. Everything else on the form
confirms or corrects what the code implied. The component adds no visual flourish; its quality is
in how cleanly it handles the ambiguous cases.

## Component shape (proposal for Frontend Engineer)

```tsx
<AddressForm
  name="shipping"             // prefixes field names: shipping[province_code] ...
  value={value}               // { province_code, district_code, subdistrict_code, postal_code } | partial
  onChange={setValue}
  locale="th"                 // "th" | "en"; names and labels follow it
  mode="postal-first"         // "postal-first" (default) | "area-first" | "search"
  showFacilityCodes={false}
  snapshot="2026-10-xx"       // pinned by the package; never "latest"
  disabled? required?
/>
```

- **Hidden inputs:** it renders hidden `<input name="shipping[province_code]">` and so on, so a
  plain HTML form posts the codes. It also works as a controlled field under react-hook-form
  (`Controller`); the demo shows one example of each.
- **"Same as":** this is a small wrapper, `<AddressSameAs source={shipping}>`, not a mode, so any
  two forms can be linked.
- **What it does not own:** the house number, street and soi line, and the recipient's name. Those
  stay as the host app's own fields (the dashed outline in the demo screen).

## Interaction by case

Screens: `png/1-postal-first.*`, `2-facility-unknown-states.*`, `3-area-first.*`, `4-search.*`,
`5-multiple.*`, `6-mobile.*`, `7-demo-site.*` (TH and EN). Names in the screens come from the
current `farzai/thailand-address` data. The dataset snapshot is not published yet.

### 1. Postal code first (default)

**Order and input rules:**
- Postal code first, then a three-column row (Province, District, Subdistrict) that stacks on
  narrow screens.
- The postal code input has `inputmode="numeric"`, `autocomplete="postal-code"`, `maxlength=5` and
  `pattern="[0-9]*"`.
- Spaces are stripped. Thai digits ๐–๙ are converted to 0–9. Other characters are rejected
  silently.
- A lookup runs when there are exactly 5 digits. Browser autofill of the postal code triggers the
  same lookup.

**What happens for each kind of code:**

| Case | Example | Behaviour |
|---|---|---|
| One subdistrict | 83100 → ตำบลกะรน, อ.เมืองภูเก็ต, ภูเก็ต | All three fields fill. A note beside the code reads "✓ เติมจากรหัสไปรษณีย์ 83100 · ล้าง". The live region announces the full address. Focus stays in the postal code. |
| Several subdistricts, one district | 10200 → 12 แขวง in เขตพระนคร | Province and district fill. The subdistrict combobox is narrowed to those 12, gets a description "รหัส 10200 ใช้ได้ 12 แขวง เลือกแขวงของคุณ", and is marked as the next step. It does **not** open by itself and does **not** steal focus. The next Tab lands on it, because filled fields stay in the tab order. |
| Several districts or provinces | 13240 → 5 ตำบล in อ.บ้านแพรก (อยุธยา) and ต.โก่งธนู (ลพบุรี) | A combined picker appears directly under the postal code, before the selects. Each option reads "ตำบล" with "อ.… › จังหวัด" on a second line. With 6 options or fewer it is a `RadioGroup`; with more it is a searchable combobox (the maximum in today's data is 33). Picking one fills all three selects. |
| Facility code | 10001 | Hidden by default. An informational `Alert` says it is a facility code, using the dataset `note` (never a hard-coded name), with "ใช้รหัสนี้ต่อ". The fields stay empty and usable. With `showFacilityCodes`, facility codes behave like ordinary codes. |
| Unknown code | 99999 | An informational `Alert`, "ไม่พบรหัสไปรษณีย์ 99999 …", and manual selection stays fully enabled. It is never an error while typing. |
| Unknown code, then an area picked | 99999, then กะรน | The code is marked invalid with a fix: "ตำบลกะรนใช้รหัส 83100 · ใช้ 83100". On submit: "รหัสไปรษณีย์นี้ไม่ตรงกับตำบล/แขวงที่เลือก" (the same meaning as the Laravel `thai_postal_code:field` rule). |

**Editing after an autofill:**
- Editing the postal code after an autofill re-runs the lookup and replaces the selects.
- Changing a select by hand keeps the postal code only if it still serves the new subdistrict.
  Otherwise the code clears, or switches to the area's only code, and the live region says so.
- "ล้าง" clears all four values.

### 2. Area first

**The cascade:**
- Province (77, searchable), then District, then Subdistrict. Each select is disabled, with a
  reason in its description ("เลือกจังหวัดก่อน"), until its parent is chosen.
- Picking a subdistrict that has one postal code fills it. If it has several, a `ToggleGroup`
  appears under the label "รหัสไปรษณีย์ของพื้นที่นี้" (เกาะแก้ว: 83000 / 83200; บางรัก: 10500 /
  10501). The user must choose; nothing is pre-selected unless only one non-facility code remains.
- Changing a parent clears the levels below it. Values that are still valid are kept. The live
  region says what was cleared.

### 3. Single search box

**Matching:**
- A combobox labelled "ค้นหาที่อยู่" / "Find your address".
- It matches Thai and English names, ignores the prefixes ต./อ./จ./ตำบล/อำเภอ/จังหวัด/เขต/แขวง,
  and ignores case and spaces. Digits match postal codes by prefix.
- It starts at 2 letters or 3 digits.

**Results:**
- At most 8 results, ranked subdistrict match › district match › province match, then by name.
- Each result is the one-line full address with the matched part in bold, and the postal code on
  the right.
- When there are more than 8 matches, the list ends with "พิมพ์เพิ่มเพื่อให้ผลแคบลง".

**After choosing a result:**
- The fields below fill and stay editable. The search box shows the chosen one-line address.
- When the subdistrict has more than one postal code, the result lists one row per code.
- The search mode always shows the fields below it, so manual correction is one Tab away. "กรอกเอง"
  in the empty state moves focus to the province select.

### 4. Multiple addresses ("same as")

**While the box is ticked:**
- The second address (for example the tax invoice address) defaults to the checkbox "ใช้ที่อยู่
  เดียวกับที่อยู่จัดส่ง" ticked. It shows a one-line read-only summary.
- Its value mirrors the source address and stays in sync while ticked.

**When the user unticks it:**
- The source's current values are **copied in, ready to edit**. They are never blank, because most
  invoice addresses differ only slightly.
- Focus moves to the copied postal code.
- Re-ticking discards the edits after a confirmation only if the user changed something.

**Payload:** both addresses are posted in full, so the server never has to resolve "same as".

### 5. Details

**Labels follow `kind`:**
- Before a province is chosen, the labels read "อำเภอ/เขต" and "ตำบล/แขวง".
- After that:

  | `kind` | TH | EN |
  |---|---|---|
  | khet | เขต | District (khet) |
  | khwaeng | แขวง | Subdistrict (khwaeng) |
  | amphoe | อำเภอ | District |
  | tambon | ตำบล | Subdistrict |

- Placeholders follow the label ("เลือกแขวง"). Field ids and names never change.

**Display format, used in the summary, search results and live announcements:**
- Bangkok: `แขวง{s} เขต{d} กรุงเทพมหานคร {pc}`.
- Elsewhere: `ตำบล{s} อำเภอ{d} จังหวัด{p} {pc}`.
- English: `{s}, {d}, {p} {pc}`.
- Pickers show bare names. The dataset stores names without prefixes.

**Thai / English:**
- The `locale` prop switches labels and names; the codes are unchanged, so switching never loses a
  value.
- Search always matches both languages.

**Mobile:**
- Below 640px every picker opens in a bottom `Drawer` with its own search field, as in shadcn's
  responsive combobox pattern.
- List rows are at least 44px tall.
- The fields stack in order.

**States:**

| State | What shows |
|---|---|
| Empty | Placeholders and descriptions, with no error styling. |
| Loading | The small indexes load on first focus. Per-province names load when a province is chosen. A spinner shows inside the active input, with `aria-busy` on the fieldset. Typing is never blocked: a pending lookup runs when the data arrives. |
| Error | A destructive `Alert`: "โหลดข้อมูลที่อยู่ไม่สำเร็จ", with "ลองอีกครั้ง". Entered values are kept. |
| Not found | A postal code nobody knows (1, above), or a search with no match: "ไม่พบ “…”", with a hint and "กรอกเอง". |
| Validation | On submit only, never on blur while the user is mid-flow: "กรุณาเลือก{field}", plus the mismatch message. Messages are written to agree with the Laravel rules' meanings. |

### 6. Output

```json
{ "province_code": "83", "district_code": "8301", "subdistrict_code": "830108", "postal_code": "83100" }
```

- Codes are strings. A partial value has `null` for unset levels, never `""`, matching the dataset
  convention.
- The demo shows the matching Laravel validation using the library's existing string rules:
  `thai_province`, `thai_district:…province_code`, `thai_subdistrict:…district_code` and
  `thai_postal_code:…subdistrict_code`.

## Accessibility floor

- **Grouping:** each address is a `<fieldset>` with a `<legend>`. Every control has a visible
  `<Label htmlFor>`, and placeholders never replace labels.
- **Comboboxes:** use shadcn's `Popover` + `Command`: a `combobox` role with `aria-expanded` and
  `aria-controls`, an active option via `aria-activedescendant`, arrow keys to move, Enter to
  choose, Esc to close and return focus, and type-ahead filtering.
  - A disabled select explains why with `aria-describedby` ("เลือกจังหวัดก่อน").
- **Ambiguous postal codes:** the `RadioGroup` is a real radio group with a label. Arrow keys move
  between options and Space selects.
- **Live region:** one polite region per component announces each autofill, narrowing, clear and
  not-found, in the form's language. It never announces on every keystroke.
- **Focus:** the component never moves focus on its own, except "กรอกเอง" and unticking "same as",
  which are user-initiated. The focus ring is the host theme's `ring`.
- **Errors:** set `aria-invalid` and `aria-describedby` pointing at the message, and put focus on
  the first invalid field on submit. Never use colour alone; the text is always present.
- **Targets:** controls are 36px high (shadcn default) on desktop. Rows are at least 44px in the
  mobile Drawer.
- **Contrast:** it inherits the host tokens. The muted description text is the shadcn default,
  about 4.6:1 on white. Don't lighten it.
- **Motion:** only shadcn's default popover and drawer transitions are used, and they respect
  `prefers-reduced-motion`.
- **Language:** `lang="th"` or `lang="en"` on the fieldset follows `locale`, so screen readers
  switch voice.

## Demo site (thailand-address-demo.farzai.com)

The layout is a shadcn docs style, with a sidebar on the left and content on the right
(`png/7-demo-site.*`).

- **Overview (home):**
  - title and one-line pitch, and a TH/EN switch for the whole site;
  - the install snippet: `npx shadcn@latest add https://thailand-address-demo.farzai.com/r/address-form.json`;
  - a live form with tabs for Postal code first / Area first / Search / Multiple;
  - beside it, the **live payload**, with tabs for JSON / HTML form fields / Laravel validation;
  - a dataset card: the pinned snapshot id, field docs, `schema.json`, `llms.txt`, and sources
    and licences (MDES CC-BY attribution).
- **Getting started:** Installation (shadcn CLI, the npm core package, peer dependencies) and
  Dataset (what each file is, snapshot pinning, "never guess a postal code from a district code").
- **Examples:** one page per case: postal code first, area first, single search box, multiple
  addresses, facility and unknown codes, and react-hook-form. Each has a live demo, the code and
  the payload.
- **Reference:** the `<AddressForm>` props table, the `@farzai/thailand-address` core API, Validate
  in Laravel, and `llms.txt`.
- **Copy-able sample inputs** on the examples pages: 83100, 10200, 13240, 10001, 99999, "บางรัก",
  "karon".

## Open questions for Personal Lead

1. **Data host:** #1 says `https://data.farzai.com/thailand-address/v1/…`, but the dataset design
   (thailand-address-data#1) says `https://cdn.farzai.com/thailand-address/`. Which is canonical?
   The component, the docs and `llms.txt` must name one.
2. **Facility label:** the alert uses the dataset's `note`. Is `note` filled for every facility
   code, and in both Thai and English? If not, the alert falls back to "เป็นรหัสไปรษณีย์ของ
   หน่วยงาน" without a name.
3. **Address line:** the house number and street line stay out of the component (recommended). Say
   if the owner wants an optional `line` slot.

Copy: `copy.md` (TH/EN). Prototype source: `src/index.html` (`?screen=postal|edge|area|search|multi|mobile|site&lang=th|en`).
