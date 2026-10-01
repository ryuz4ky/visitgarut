import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const requestedNext = url.searchParams.get('next') || '/account'
  const next = requestedNext.startsWith('/') ? requestedNext : '/account'
  const supabase = await createClient()

  let error: Error | null = null

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code)
    error = result.error
  } else if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    error = result.error
  } else {
    error = new Error('Missing authentication token')
  }

  const redirectUrl = new URL(error ? '/login' : next, request.url)
  if (error) redirectUrl.searchParams.set('auth_error', '1')
  return NextResponse.redirect(redirectUrl)
}
