import { NextResponse } from 'next/server'
import { ACCOUNT_USER_COOKIE_NAME } from '../../../../lib/account-cookie'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  const secure = process.env.NODE_ENV === 'production'
  res.cookies.set('sb-access-token', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure,
    maxAge: 0
  })
  res.cookies.set(ACCOUNT_USER_COOKIE_NAME, '', {
    httpOnly: false,
    path: '/',
    sameSite: 'lax',
    secure,
    maxAge: 0
  })
  return res
}
