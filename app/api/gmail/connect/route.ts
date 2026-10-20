import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(req: NextRequest) {
  const clientId = process.env.AUTH_GOOGLE_ID
  const clientSecret = process.env.AUTH_GOOGLE_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Google OAuth ayarları eksik' }, { status: 500 })
  }

  // Redirect URI belirle
  const origin = req.nextUrl.origin
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
