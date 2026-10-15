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
  constructor(
    readonly code: DatasetErrorCode,
    message: string,
    readonly url: string,
    readonly status?: number,
  ) {
    super(message)
  }
}
