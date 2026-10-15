// Cases from the code review of #3: host resets, two forms in one <form>,
// races between a late lookup and a hand pick, and the paths the first
// round of tests missed (more than 6 areas, autofill, locale, keyboard).
import * as React from "react"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import type {
  AddressValue,
  PostalLookup,
  PostalOption,
  ThaiAddress,
} from "@farzai/thailand-address"

import {
  AddressForm,
  type AddressFormProps,
} from "@/registry/address-form/address-form"

import { fixtureClient } from "./fixture-client"
import { EMPTY, pick } from "./harness"

/** A client whose lookupPostalCode or postalCodesOf can be held until released. */
function heldClient() {
  const { client } = fixtureClient()
  const held: { lookup?: () => void; serving?: () => void } = {}
  let holdLookup = false
  let holdServing = false
  const wrapped: ThaiAddress = {
    ...client,
    lookupPostalCode: (...args: Parameters<ThaiAddress["lookupPostalCode"]>) =>
      holdLookup
        ? new Promise<PostalLookup>((resolve) => {
            held.lookup = () =>
              void client.lookupPostalCode(...args).then(resolve)
          })
        : client.lookupPostalCode(...args),
    postalCodesOf: (...args: Parameters<ThaiAddress["postalCodesOf"]>) =>
      holdServing
        ? new Promise<PostalOption[]>((resolve) => {
            held.serving = () =>
              void client.postalCodesOf(...args).then(resolve)
          })
        : client.postalCodesOf(...args),
  }
  return {
    client: wrapped,
    held,
    holdLookup: (v: boolean) => (holdLookup = v),
    holdServing: (v: boolean) => (holdServing = v),
  }
}

function Host({
  client,
  forms = 1,
  initial = EMPTY,
  onSubmit,
  formProps = {},
}: {
  client: ThaiAddress
  forms?: 1 | 2
  initial?: AddressValue
  onSubmit?: () => void
  formProps?: Partial<AddressFormProps>
}) {
  const [a, setA] = React.useState<AddressValue>(initial)
  const [b, setB] = React.useState<AddressValue>(EMPTY)
  const [locale, setLocale] = React.useState<"th" | "en">("th")
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.()
      }}
      onReset={() => setA(EMPTY)}
    >
      <AddressForm
        id="ship"
        client={client}
        locale={locale}
        value={a}
        onChange={setA}
        required
        {...formProps}
      />
      {forms === 2 ? (
        <AddressForm
          id="bill"
          client={client}
          legend="bill"
          locale={locale}
          value={b}
          onChange={setB}
          required
        />
      ) : null}
      <output data-testid="a">{JSON.stringify(a)}</output>
      <button type="button" onClick={() => setA(EMPTY)}>
        host reset
      </button>
      <button
        type="button"
        onClick={() => setLocale((l) => (l === "th" ? "en" : "th"))}
      >
        toggle locale
      </button>
      <button type="reset">native reset</button>
      <button type="submit">submit</button>
    </form>
  )
}

const valueOf = () =>
  JSON.parse(screen.getByTestId("a").textContent ?? "{}") as AddressValue

describe("a value from the host", () => {
  it("resetting to empty clears the postal input and everything the last lookup showed", async () => {
    const { client } = fixtureClient()
    const user = userEvent.setup()
    render(<Host client={client} />)
    await user.type(screen.getAllByLabelText("รหัสไปรษณีย์")[0]!, "13240")
    await screen.findByRole("radiogroup")
    await user.click(screen.getByRole("button", { name: "host reset" }))
    expect(screen.getAllByLabelText("รหัสไปรษณีย์")[0]).toHaveValue("")
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument()
    expect(screen.queryByText(/เติมจากรหัสไปรษณีย์/)).not.toBeInTheDocument()
  })

  it("a native form reset empties the address too", async () => {
    const { client } = fixtureClient()
    const user = userEvent.setup()
    render(<Host client={client} />)
    await user.type(screen.getAllByLabelText("รหัสไปรษณีย์")[0]!, "83100")
    await waitFor(() => expect(valueOf().subdistrict_code).toBe("830108"))
    await user.click(screen.getByRole("button", { name: "native reset" }))
    await waitFor(() => expect(valueOf()).toEqual(EMPTY))
    expect(screen.getAllByLabelText("รหัสไปรษณีย์")[0]).toHaveValue("")
    expect(screen.queryByText(/เติมจากรหัสไปรษณีย์/)).not.toBeInTheDocument()
  })
})

describe("two address forms in one <form>", () => {
  it("submit focuses the first invalid field in page order, not the last form's", async () => {
    const { client } = fixtureClient()
    const user = userEvent.setup()
    let submitted = 0
    render(<Host client={client} forms={2} onSubmit={() => submitted++} />)
    await user.click(screen.getByRole("button", { name: "submit" }))
    await waitFor(() =>
      expect(document.getElementById("ship-postal")).toHaveFocus()
    )
    expect(submitted).toBe(0)
  })

  it("the second form's error is focused when the first is complete", async () => {
    const { client } = fixtureClient()
    const user = userEvent.setup()
    render(
      <Host
        client={client}
        forms={2}
        initial={{
          province_code: "83",
          district_code: "8301",
          subdistrict_code: "830108",
          postal_code: "83100",
        }}
      />
    )
    await waitFor(() =>
      expect(
        screen.getAllByRole("combobox", { name: "ตำบล" })[0]
      ).toHaveTextContent("กะรน")
    )
    await user.click(screen.getByRole("button", { name: "submit" }))
    await waitFor(() =>
      expect(document.getElementById("bill-postal")).toHaveFocus()
    )
  })
})

describe("races", () => {
  it("a lookup that lands after a hand pick does not overwrite it", async () => {
    const h = heldClient()
    const user = userEvent.setup()
    render(<Host client={h.client} />)
    h.holdLookup(true)
    await user.type(screen.getAllByLabelText("รหัสไปรษณีย์")[0]!, "83100")
    h.holdLookup(false)
    await pick(user, "จังหวัด", "ตรัง")
    await pick(user, "อำเภอ", "เมืองตรัง")
    await pick(user, "ตำบล", "บางรัก")
    await waitFor(() => expect(valueOf().subdistrict_code).toBe("920109"))
    h.held.lookup?.()
    await new Promise((r) => setTimeout(r, 50))
    expect(valueOf().subdistrict_code).toBe("920109")
    expect(valueOf().province_code).toBe("92")
  })

  it("submit waits while the subdistrict's postal codes are still loading", async () => {
    const h = heldClient()
    const user = userEvent.setup()
    let submitted = 0
    h.holdServing(true)
    render(
      <Host
        client={h.client}
        onSubmit={() => submitted++}
        initial={{
          province_code: "83",
          district_code: "8301",
          subdistrict_code: "830108",
          postal_code: "99999",
        }}
      />
    )
    await user.click(screen.getByRole("button", { name: "submit" }))
    expect(submitted).toBe(0)
    expect(
      await screen.findByText("กำลังตรวจรหัสไปรษณีย์ ลองส่งอีกครั้งในอีกครู่")
    ).toBeInTheDocument()
  })
})

describe("paths the first tests missed", () => {
  it("a code with more than 6 areas offers a searchable picker, not radios: 10540", async () => {
    const { client } = fixtureClient()
    const user = userEvent.setup()
    render(<Host client={client} />)
    await user.type(screen.getAllByLabelText("รหัสไปรษณีย์")[0]!, "10540")
    const picker = await screen.findByRole("combobox", {
      name: "พื้นที่ของรหัส 10540",
    })
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument()
    await user.click(picker)
    const options = within(await screen.findByRole("listbox")).getAllByRole(
      "option"
    )
    expect(options).toHaveLength(9)
    await user.click(options[0]!)
    await waitFor(() => expect(valueOf().subdistrict_code).not.toBeNull())
    expect(valueOf().postal_code).toBe("10540")
  })

  it("browser autofill (the whole code at once) takes the same path as typing", async () => {
    const { client } = fixtureClient()
    render(<Host client={client} />)
    fireEvent.change(screen.getAllByLabelText("รหัสไปรษณีย์")[0]!, {
      target: { value: "83100" },
    })
    await waitFor(() => expect(valueOf().subdistrict_code).toBe("830108"))
  })

  it("switching locale mid-flow keeps every code and renames the fields", async () => {
    const { client } = fixtureClient()
    const user = userEvent.setup()
    render(<Host client={client} />)
    await user.type(screen.getAllByLabelText("รหัสไปรษณีย์")[0]!, "10200")
    await waitFor(() => expect(valueOf().district_code).toBe("1001"))
    await user.click(screen.getByRole("button", { name: "toggle locale" }))
    expect(valueOf()).toMatchObject({
      province_code: "10",
      district_code: "1001",
      postal_code: "10200",
    })
    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "District (khet)" })
      ).toHaveTextContent("Phra Nakhon")
    )
    expect(screen.getByLabelText("Postal code")).toHaveValue("10200")
  })

  it("keyboard only: open a picker with Enter, filter, choose with Enter; Escape returns focus", async () => {
    const { client } = fixtureClient()
    const user = userEvent.setup()
    render(<Host client={client} formProps={{ mode: "area-first" }} />)
    const province = screen.getByRole("combobox", { name: "จังหวัด" })
    province.focus()
    await user.keyboard("{Enter}")
    await screen.findByRole("listbox")
    await user.keyboard("ภูเก็ต")
    await user.keyboard("{Enter}")
    await waitFor(() => expect(valueOf().province_code).toBe("83"))
    await waitFor(() => expect(province).toHaveFocus())
    await user.keyboard("{Enter}")
    await screen.findByRole("listbox")
    await user.keyboard("{Escape}")
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    )
    expect(province).toHaveFocus()
  })

  it("Enter with suggestions open and none highlighted does not submit; it highlights the first", async () => {
    const { client } = fixtureClient()
    const user = userEvent.setup()
    let submitted = 0
    render(
      <Host
        client={client}
        formProps={{ mode: "search" }}
        onSubmit={() => submitted++}
      />
    )
    const box = screen.getByRole("combobox", { name: "ค้นหาที่อยู่" })
    await user.type(box, "karon")
    await screen.findByRole("option")
    await user.keyboard("{Enter}")
    expect(submitted).toBe(0)
    expect(screen.queryByText("กรุณาเลือกจังหวัด")).not.toBeInTheDocument()
    expect(box).toHaveAttribute("aria-activedescendant")
    await user.keyboard("{Enter}")
    await waitFor(() => expect(valueOf().subdistrict_code).toBe("830108"))
  })

  it("English placeholders read in sentence case", async () => {
    const { client } = fixtureClient()
    const user = userEvent.setup()
    render(<Host client={client} />)
    await user.click(screen.getByRole("button", { name: "toggle locale" }))
    expect(
      screen.getByRole("combobox", { name: "District" })
    ).toHaveTextContent("Select district")
    await user.type(screen.getByLabelText("Postal code"), "10200")
    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "Subdistrict (khwaeng)" })
      ).toHaveTextContent("Select subdistrict (khwaeng)")
    )
  })
})
