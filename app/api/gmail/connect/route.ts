import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getGoogleOAuthCredentials } from '@/lib/gmail/oauth'

export async function GET(req: NextRequest) {
  const { clientId, clientSecret } = await getGoogleOAuthCredentials()

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Google OAuth ayarları eksik' }, { status: 500 })
  }

  // Redirect URI belirle
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host
  const proto = req.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const origin = `${proto}://${host}`
  const redirectUri = `${origin}/api/gmail/callback`

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
  ]

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  })

  return NextResponse.redirect(authUrl)
}
