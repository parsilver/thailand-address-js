# address-form (shadcn/ui registry item)

A Thai address as four codes: `province_code`, `district_code`, `subdistrict_code` and `postal_code`. The user types the postal code and the rest fills in. Every case in [issue #1](https://github.com/parsilver/thailand-address-js/issues/1) and the [design brief](../docs/design/brief.md) is covered.

```sh
npx shadcn@latest add https://thailand-address-demo.farzai.com/r/address-form.json
```

The install brings in `@farzai/thailand-address` from npm. It also adds these shadcn components: `field`, `label`, `input`, `button`, `popover`, `command`, `drawer`, `radio-group`, `toggle-group`, `checkbox` and `alert`.

```tsx
import { AddressForm, type AddressValue } from "@/components/address-form/address-form"
import { AddressSameAs } from "@/components/address-form/address-same-as"

const [shipping, setShipping] = useState<AddressValue>(EMPTY)
const [tax, setTax] = useState<AddressValue>(EMPTY)

<form action="/checkout" method="post">
  <AddressForm name="shipping" value={shipping} onChange={setShipping} required />
  <AddressSameAs name="tax" source={shipping} value={tax} onChange={setTax}>
    {(field) => <AddressForm name="tax" legend="ที่อยู่ใบกำกับภาษี" {...field} />}
  </AddressSameAs>
</form>
```

## Props

| Prop | Default | |
|---|---|---|
| `name` | none | Prefixes the hidden inputs: `shipping[province_code]` and so on, so a plain form posts the codes. |
| `value`, `onChange`, `defaultValue` | | Controlled or uncontrolled. Unset levels are `null`. |
| `locale` | `"th"` | `"th"` or `"en"`. Changes labels, names and announcements, and sets `lang`. |
| `mode` | `"postal-first"` | `"postal-first"`, `"area-first"` or `"search"`. |
| `showFacilityCodes` | `false` | Treats mail-centre codes such as 10001 like ordinary codes. |
| `required` | `false` | When true, every field is needed to submit. When false, an empty address submits but a partial one does not. |
| `legend`, `disabled`, `id`, `className` | | |
| `client` | shared | A `createThaiAddress()` client, for example to use another data host. |

**Validation runs on submit only.** It listens for its form's `submit` event on the document, in the capture phase, so it runs before the form's own listeners. When the address is invalid it calls `stopPropagation()`, which also stops every other `submit` listener on the page for that submit. With several address forms in one `<form>`, focus goes to the first invalid field on the page. A native form reset empties the address. An invalid address stops the submit, shows its messages and marks the fields `aria-invalid`. This works for a plain form and for react-hook-form's `handleSubmit`. The messages mean the same as the Laravel rules `thai_province`, `thai_district`, `thai_subdistrict` and `thai_postal_code`. This check only helps the user. Anyone can post any codes, so **the server must still validate them**, for example with those rules.

**Privacy:** the visitor's browser loads the dataset files from data.farzai.com, so that host sees the visitor's IP and the province chosen. The files are fetched without cookies or a Referer. To keep this on your own origin, self-host the snapshot and pass `client={createThaiAddress({ baseUrl })}`, then allow only that origin in your CSP `connect-src`.

## Develop

```sh
pnpm --filter @thailand-address/registry test            # Vitest + Testing Library + axe, on real-data fixtures
pnpm --filter @thailand-address/registry dev             # preview: ?mode=area-first|search|multiple, ?locale=en
pnpm --filter @thailand-address/registry registry:build  # writes public/r/*.json (CI checks it is current)
```

`src/registry/address-form/` holds the item's files. `src/components/ui/` holds the stock shadcn components it depends on, which are not shipped.
