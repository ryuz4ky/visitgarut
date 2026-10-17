import type { ValidationRecord } from './validation'
type QueryResult = { rows: Record<string, unknown>[] }
export type EvaluationConnection = { query: (sql: string, values?: unknown[]) => Promise<QueryResult> }
async function requests(client: EvaluationConnection, limitKey: string, resetsAt: Date) {
  const result = await client.query(`INSERT INTO vg_trip_validation_limits(key,requests,resets_at) VALUES($1,1,$2)
    ON CONFLICT(key) DO UPDATE SET requests=vg_trip_validation_limits.requests+1 RETURNING requests`, [limitKey, resetsAt])
  return Number(result.rows[0].requests)
}
// The caller owns the connection. Transactions serialize duplicate requests and withdrawals.
export async function recordEvaluation(client: EvaluationConnection, data: ValidationRecord, limitKey: string, resetsAt: Date) {
  await client.query('BEGIN')
  try {
    if (await requests(client, limitKey, resetsAt) > 200) { await client.query('COMMIT'); return 'limited' as const }
    await client.query("DELETE FROM vg_trip_validation WHERE created_at<=now()-interval '30 days'")
    await client.query('DELETE FROM vg_trip_validation_limits WHERE resets_at<=now()')
    const result = await client.query(`INSERT INTO vg_trip_validation(session,stages,helpfulness,barrier) VALUES($1,$2,$3,$4)
      ON CONFLICT(session) DO UPDATE SET
      stages=ARRAY(SELECT DISTINCT unnest(vg_trip_validation.stages || EXCLUDED.stages)),
      helpfulness=COALESCE(EXCLUDED.helpfulness,vg_trip_validation.helpfulness),
      barrier=COALESCE(EXCLUDED.barrier,vg_trip_validation.barrier)
      WHERE NOT vg_trip_validation.withdrawn RETURNING session`, [data.session, data.stages, data.feedback?.helpfulness ?? null, data.feedback?.barrier ?? null])
    await client.query('COMMIT')
    return result.rows.length ? 'saved' as const : 'withdrawn' as const
  } catch (error) { await client.query('ROLLBACK'); throw error }
}
export async function withdrawEvaluation(client: EvaluationConnection, session: string, limitKey: string, resetsAt: Date) {
  // Keep only an empty tombstone until retention cleanup, so an in-flight request cannot restore erased answers.
  await client.query('BEGIN')
  try {
    // A separate higher threshold leaves room to withdraw after the recording limit.
    if (await requests(client, limitKey, resetsAt) > 400) { await client.query('COMMIT'); return false }
    await client.query(`INSERT INTO vg_trip_validation(session,stages,withdrawn) VALUES($1,'{}',true)
      ON CONFLICT(session) DO UPDATE SET stages='{}',helpfulness=NULL,barrier=NULL,withdrawn=true`, [session])
    await client.query('COMMIT'); return true
  } catch (error) { await client.query('ROLLBACK'); throw error }
}
