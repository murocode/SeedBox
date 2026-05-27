import { NextResponse } from 'next/server'

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
  return res
}
