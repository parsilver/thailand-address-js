/**
 * The dataset snapshot this package version is built and tested against.
 * Snapshots are immutable, so pinning one keeps every lookup reproducible.
 * A new snapshot ships as a new package version; never read latest.json.
 */
export const SNAPSHOT = '2026-10-15'

/** Where the dataset's v1 snapshots live. */
export const DEFAULT_BASE_URL = 'https://data.farzai.com/thailand-address/v1'

/** The schema major this package reads. A minor bump only adds fields. */
export const SCHEMA_MAJOR = 1
