import * as duckdb from '@duckdb/duckdb-wasm'

export const DATA_BASE_URL = (import.meta.env.VITE_DATA_BASE_URL as string) ?? 'http://localhost:8001/parquet'

interface DBState {
  db: duckdb.AsyncDuckDB
  conn: duckdb.AsyncDuckDBConnection
}

let initPromise: Promise<DBState> | null = null

async function initDuckDB(): Promise<DBState> {
  const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles())

  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' })
  )
  const worker = new Worker(workerUrl)
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING)
  const db = new duckdb.AsyncDuckDB(logger, worker)
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker)
  URL.revokeObjectURL(workerUrl)

  await db.open({
    filesystem: {
      reliableHeadRequests: true,   // trust HEAD to detect range support
      allowFullHTTPReads: false,    // don't silently fall back to full reads
      forceFullHTTPReads: false,    // explicitly disable full-file fetches
    },
  })

  const conn = await db.connect()
  return { db, conn }
}

function getState(): Promise<DBState> {
  if (!initPromise) initPromise = initDuckDB()
  return initPromise
}

export async function getDB(): Promise<duckdb.AsyncDuckDB> {
  return (await getState()).db
}

export async function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  return (await getState()).conn
}

// --- URL resolution cache ---
// HF redirects to signed S3 URLs that expire after ~3600s. We cache the
// resolved direct URL per logical name and re-resolve when near expiry.

interface CachedUrl {
  directUrl: string
  expiresAt: number
}

const urlCache = new Map<string, CachedUrl>()
const TTL_MS = 55 * 60 * 1000 // 55 min — safely under the 60-min signed URL expiry

export async function resolveDirectUrl(logicalUrl: string): Promise<string> {
  const cached = urlCache.get(logicalUrl)
  if (cached && Date.now() < cached.expiresAt) return cached.directUrl

  const resp = await fetch(logicalUrl, { method: 'HEAD' })
  // After following redirects, resp.url is the final direct URL
  const directUrl = resp.url

  urlCache.set(logicalUrl, { directUrl, expiresAt: Date.now() + TTL_MS })
  return directUrl
}
