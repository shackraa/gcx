import { fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'

export async function getGoogleOAuthCredentials() {
  let clientId =
    process.env.AUTH_GOOGLE_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID

  let clientSecret =
    process.env.AUTH_GOOGLE_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    try {
      const config = await fetchQuery(api.settings.getGoogleOAuthConfig, {})
      if (config?.clientId && config?.clientSecret) {
        clientId = config.clientId
        clientSecret = config.clientSecret
      }
    } catch (err) {
      console.warn('Convex OAuth config query failed:', err)
    }
  }

  return { clientId, clientSecret }
}
