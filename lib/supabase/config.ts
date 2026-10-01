const fallbackUrl = 'https://txdfxscdcipcvybujvdl.supabase.co'
const fallbackPublishableKey = 'sb_publishable_0u_K3HtLTfRfi6rhn2j-Rg_42-eWFB-'

export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackUrl,
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || fallbackPublishableKey,
  }
}
