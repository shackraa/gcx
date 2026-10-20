import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/dashboard?gmail_error=access_denied', req.url))
  }

  const clientId = process.env.AUTH_GOOGLE_ID
  const clientSecret = process.env.AUTH_GOOGLE_SECRET
  const origin = req.nextUrl.origin
  const redirectUri = `${origin}/api/gmail/callback`

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
    const { tokens } = await oauth2Client.getToken(code)

    // Token başarıyla alındı
    // Çerezde veya kullanıcı oturumunda güvenli saklamak için cookie'ye yazıyoruz
    const res = NextResponse.redirect(new URL('/dashboard?gmail_connected=true', req.url))

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
    return NextResponse.redirect(new URL('/dashboard?gmail_error=token_failed', req.url))
  }
}
