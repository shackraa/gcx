import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const refreshToken = req.cookies.get('gcx_gmail_refresh_token')?.value
  const accessToken = req.cookies.get('gcx_gmail_access_token')?.value

  return NextResponse.json({
    connected: Boolean(refreshToken || accessToken),
  })
}
