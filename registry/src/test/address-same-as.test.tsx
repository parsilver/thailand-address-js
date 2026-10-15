import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import type { AddressValue } from "@farzai/thailand-address"

import { AddressForm } from "@/registry/address-form/address-form"
import { AddressSameAs } from "@/registry/address-form/address-same-as"

import { fixtureClient } from "./fixture-client"

const KARON: AddressValue = {
  province_code: "83",
  district_code: "8301",
  subdistrict_code: "830108",
  postal_code: "83100",
}

function setup() {
  const { client } = fixtureClient()
  const user = userEvent.setup()
  let tax: AddressValue | null = null
  function Harness() {
    const [shipping] = React.useState(KARON)
    const [value, setValue] = React.useState<AddressValue>({
      province_code: null,
      district_code: null,
      subdistrict_code: null,
      postal_code: null,
    })
    tax = value
    return (
      <AddressSameAs
        client={client}
        name="tax"
        source={shipping}
        value={value}
        onChange={setValue}
      >
        {(field) => (
          <AddressForm client={client} legend="ที่อยู่ใบกำกับภาษี" {...field} />
        )}
      </AddressSameAs>
    )
  }
  const utils = render(<Harness />)
  return { ...utils, user, tax: () => tax }
}

describe("AddressSameAs", () => {
  it("defaults to ticked, mirrors the source, shows a summary and posts it in full", async () => {
    const { tax, container } = setup()
    expect(
      screen.getByRole("checkbox", { name: "ใช้ที่อยู่เดียวกับที่อยู่จัดส่ง" })
    ).toBeChecked()
    await waitFor(() => expect(tax()).toEqual(KARON))
    expect(
      await screen.findByText("ตำบลกะรน อำเภอเมืองภูเก็ต จังหวัดภูเก็ต 83100")
    ).toBeInTheDocument()
    expect(
      container.querySelector('input[name="tax[postal_code]"]')
    ).toHaveValue("83100")
    expect(screen.queryByLabelText("รหัสไปรษณีย์")).not.toBeInTheDocument()
  })

  it("unticking copies the source in, ready to edit, and focuses the postal code", async () => {
    const { user, tax } = setup()
    await waitFor(() => expect(tax()).toEqual(KARON))
    await user.click(screen.getByRole("checkbox"))
    const postal = await screen.findByLabelText("รหัสไปรษณีย์")
    expect(postal).toHaveValue("83100")
    expect(postal).toHaveFocus()
    expect(tax()).toEqual(KARON)
  })

  it("re-ticking asks first only when something was changed", async () => {
    const { user, tax } = setup()
    await waitFor(() => expect(tax()).toEqual(KARON))
    await user.click(screen.getByRole("checkbox"))
    await user.click(screen.getByRole("checkbox"))
    expect(screen.getByRole("checkbox")).toBeChecked()
    await user.click(screen.getByRole("checkbox"))
    const postal = await screen.findByLabelText("รหัสไปรษณีย์")
    await user.clear(postal)
    await user.type(postal, "10200")
    await waitFor(() => expect(tax()?.district_code).toBe("1001"))
    await user.click(screen.getByRole("checkbox"))
    expect(
      screen.getByText("ใช้ที่อยู่จัดส่งแทนที่อยู่ที่แก้ไว้ใช่ไหม")
    ).toBeInTheDocument()
    expect(screen.getByRole("checkbox")).not.toBeChecked()
    await user.click(screen.getByRole("button", { name: "ใช้ที่อยู่จัดส่ง" }))
    expect(screen.getByRole("checkbox")).toBeChecked()
    await waitFor(() => expect(tax()).toEqual(KARON))
  })
})
