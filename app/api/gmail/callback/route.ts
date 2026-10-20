import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getGoogleOAuthCredentials } from '@/lib/gmail/oauth'

export async function GET(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host
  const proto = req.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const origin = `${proto}://${host}`
  const redirectUri = `${origin}/api/gmail/callback`

  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${origin}/dashboard?gmail_error=access_denied`)
  }

  const { clientId, clientSecret } = await getGoogleOAuthCredentials()

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/dashboard?gmail_error=config_missing`)
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
    const { tokens } = await oauth2Client.getToken(code)

    // Token başarıyla alındı
    // Çerezde güvenli saklamak için cookie'ye yazıyoruz
    const res = NextResponse.redirect(`${origin}/dashboard?gmail_connected=true`)

    if (tokens.refresh_token) {
      res.cookies.set('gcx_gmail_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 gün
        path: '/',
      })
    }
    if (tokens.access_token) {
      res.cookies.set('gcx_gmail_access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
        path: '/',
      })
    }

    return res
  } catch (err: any) {
    console.error('Gmail OAuth token error:', err)
    return NextResponse.redirect(`${origin}/dashboard?gmail_error=token_failed`)
  }
}
