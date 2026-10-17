export const validationStages = {
  opened: 'Membuka planner',
  selected: 'Memilih tempat',
  budget_viewed: 'Membuka bagian biaya',
  time_viewed: 'Membuka bagian waktu',
  route_requested: 'Meminta estimasi rute',
  route_received: 'Menerima estimasi rute',
  plan_completed: 'Melengkapi biaya, waktu, dan transport pulang',
  share_copied: 'Berhasil menyalin tautan',
  summary_copied: 'Berhasil menyalin ringkasan',
  maps_opened: 'Memilih tautan Maps',
  operator_opened: 'Memilih kanal pengelola',
} as const
export type ValidationStage = keyof typeof validationStages
export const helpfulnessLabels = { yes: 'Membantu', partly: 'Sebagian membantu', no: 'Belum membantu' } as const
export const barrierLabels = {
  costs: 'Harga atau biaya belum jelas',
  transport: 'Transport pergi atau pulang',
  access: 'Akses dan kebutuhan keluarga',
  time: 'Waktu atau rute perjalanan',
  choice: 'Sulit menentukan tempat',
  other: 'Hal lain',
  none: 'Tidak ada hambatan',
} as const
export type ValidationFeedback = { helpfulness: keyof typeof helpfulnessLabels; barrier: keyof typeof barrierLabels }
export type ValidationRecord = { session: string; stages: ValidationStage[]; feedback?: ValidationFeedback }
export const validEvaluationSession = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
export function evaluationSessionFromBytes(randomBytes: Uint8Array): string {
  if (randomBytes.length !== 16) throw Error('Expected 16 random bytes')
  const bytes = Uint8Array.from(randomBytes)
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const onlyKeys = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).every(key => keys.includes(key))
export function parseValidationRecord(value: unknown): ValidationRecord | null {
  if (!object(value) || !onlyKeys(value, ['session', 'stages', 'feedback']) || !validEvaluationSession(value.session)) return null
  if (!Array.isArray(value.stages) || !value.stages.length || value.stages.length > Object.keys(validationStages).length) return null
  if (value.stages.some(stage => typeof stage !== 'string' || !Object.hasOwn(validationStages, stage))) return null
  const stages = [...new Set(value.stages)] as ValidationStage[]
  if (!stages.includes('opened') || (stages.some(stage => !['opened', 'selected'].includes(stage)) && !stages.includes('selected'))) return null
  let feedback: ValidationFeedback | undefined
  if (value.feedback !== undefined) {
    if (!object(value.feedback) || !onlyKeys(value.feedback, ['helpfulness', 'barrier'])) return null
    const { helpfulness, barrier } = value.feedback
    if (typeof helpfulness !== 'string' || !Object.hasOwn(helpfulnessLabels, helpfulness) || typeof barrier !== 'string' || !Object.hasOwn(barrierLabels, barrier)) return null
    feedback = { helpfulness, barrier } as ValidationFeedback
  }
  return { session: value.session, stages, ...(feedback ? { feedback } : {}) }
}
export function parseValidationWithdrawal(value: unknown): string | null {
  return object(value) && onlyKeys(value, ['session']) && validEvaluationSession(value.session) ? value.session : null
}
