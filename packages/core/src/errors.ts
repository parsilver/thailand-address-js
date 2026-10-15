export type DatasetErrorCode =
  /** The request failed, or the server answered outside 2xx. */
  | 'http'
  /** The body was not JSON, or not a {schema_version, snapshot, data} envelope. */
  | 'invalid_file'
  /** The file belongs to a different snapshot than the one pinned. */
  | 'snapshot_mismatch'
  /** The file's schema major is not one this package reads. */
  | 'schema_version'

/** A dataset file could not be loaded or trusted. Retrying the call refetches it. */
export class DatasetError extends Error {
  override readonly name = 'DatasetError'
  readonly code: DatasetErrorCode
  readonly url: string
  readonly status: number | undefined

  constructor(code: DatasetErrorCode, message: string, url: string, status?: number) {
    super(message)
    this.code = code
    this.url = url
    this.status = status
  }
}
