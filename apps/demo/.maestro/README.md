# End-to-end flows (Maestro web)

One flow per case in issue #1 and its design brief, run against the demo site.

## Run

```sh
pnpm --filter @thailand-address/demo build
pnpm --filter @thailand-address/demo exec wrangler dev --port 8788
maestro --platform web test apps/demo/.maestro -e BASE=http://localhost:8788
```

The flows read the live dataset on data.farzai.com, so a network connection is needed.

| Flow | Case |
|---|---|
| `01-postal-83100` | Postal code with one subdistrict fills every level |
| `02-postal-10200` | Several khwaeng in one khet: the picker narrows to 12 and stays closed |
| `03-postal-13240` | Several districts and provinces: a radio group of 6 |
| `04-postal-10001` | Facility code: hidden, named from the dataset, "use this code" keeps it |
| `05-postal-99999` | Unknown code, then an area picked: the postal code is flagged with a fix |
| `06-area-first` | Area first: disabled levels, a choice of two codes, a province change clears below |
| `07-search` | Single search box: Thai, English with spaces, no match |
| `08-multiple` | Tax invoice address mirrors shipping; unticking copies it; re-ticking after an edit asks first |
| `09-english` | Bangkok labels follow `kind` in Thai and English |

## Notes

- Maestro web renders at 1024×576, so on the demo's two-column layout the flows scroll to the payload panel before asserting it.
- The flows match exact visible text. When a Thai or English string changes, update the flow in the same PR.
- Focus order, `aria-*` state, the 44px drawer rows under 640px and Enter in the search list need a real browser API. Maestro web does not expose them, so they stay in the component tests.
