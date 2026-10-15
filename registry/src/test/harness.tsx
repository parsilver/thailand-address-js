import * as React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { AddressValue } from "@farzai/thailand-address"

import {
  AddressForm,
  type AddressFormProps,
} from "@/registry/address-form/address-form"

import { fixtureClient } from "./fixture-client"

export const EMPTY: AddressValue = {
  province_code: null,
  district_code: null,
  subdistrict_code: null,
  postal_code: null,
}

type Props = Partial<AddressFormProps> & {
  initial?: AddressValue
  onSubmit?: () => void
}

export function renderForm(
  props: Props = {},
  clientOpts?: Parameters<typeof fixtureClient>[0]
) {
  const { client, calls } = fixtureClient(clientOpts)
  const user = userEvent.setup()
  let current: AddressValue = props.initial ?? EMPTY
  const submitted = { count: 0 }
  function Harness() {
    const [value, setValue] = React.useState<AddressValue>(
      props.initial ?? EMPTY
    )
    current = value
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submitted.count++
          props.onSubmit?.()
        }}
      >
        <AddressForm
          client={client}
          name="shipping"
          {...props}
          value={value}
          onChange={(v) => {
            setValue(v)
            props.onChange?.(v)
          }}
        />
        <button type="submit">submit</button>
      </form>
    )
  }
  const utils = render(<Harness />)
  return { ...utils, user, calls, submitted, value: () => current }
}

/** Open a picker by its label and choose the option whose text starts with `text`. */
export async function pick(
  user: ReturnType<typeof userEvent.setup>,
  label: string | RegExp,
  text: string
) {
  await user.click(screen.getByRole("combobox", { name: label }))
  const listbox = await screen.findByRole("listbox")
  const option = within(listbox)
    .getAllByRole("option")
    .find((o) => o.textContent?.trim().startsWith(text))
  if (!option) throw new Error(`no option starting with ${text}`)
  await user.click(option)
}

export const live = (container: HTMLElement) =>
  container.querySelector('[aria-live="polite"]')
