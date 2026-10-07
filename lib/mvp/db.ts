import 'server-only'
import { Pool } from 'pg'

const globalDb = globalThis as unknown as { vgPool?: Pool }
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum dikonfigurasi')
  if (!globalDb.vgPool) globalDb.vgPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4, connectionTimeoutMillis: 5000, idleTimeoutMillis: 20000, statement_timeout: 10000 })
  return globalDb.vgPool
}
