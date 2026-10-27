// Sends due review invitations and applies retention. Compiled to .rating-worker/ and run by scripts/rating-worker.cjs from cron.
import { dueInvites, markInvited, purgeRating, type Connection } from './store'
import { newInviteToken } from './tokens'
import { inviteMessage, sendWhatsapp, type SendResult } from './whatsapp'

export async function runRatingWorker(client: Connection, baseUrl: string, now = new Date(), send: (phone: string, text: string) => Promise<SendResult> = sendWhatsapp) {
  let sent = 0
  let failed = 0
  for (const due of await dueInvites(client, now)) {
    const token = newInviteToken()
    const result = await send(due.phone_raw, inviteMessage(due.name, `${baseUrl.replace(/\/$/, '')}/nilai/${token}`))
    if (result.ok) { await markInvited(client, due.id, token, now); sent++ } else failed++
  }
  await purgeRating(client, now)
  return { sent, failed }
}
