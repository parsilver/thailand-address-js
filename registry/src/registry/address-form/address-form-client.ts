import { createThaiAddress, type ThaiAddress } from "@farzai/thailand-address"

let shared: ThaiAddress | undefined

/**
 * The client every <AddressForm> on a page shares unless one is passed in, so
 * the dataset files are fetched once per page. It reads the snapshot
 * @farzai/thailand-address pins, from data.farzai.com.
 */
export function getThaiAddressClient(): ThaiAddress {
  shared ??= createThaiAddress()
  return shared
}
