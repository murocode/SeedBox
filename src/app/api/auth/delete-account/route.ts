import { prisma } from '../../../../lib/prisma'
import { normalizeEmail } from '../../../../lib/auth'
import { supabaseServer } from '../../../../lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)

    // Verify token and get user
    const { data: userData, error: userError } = await supabaseServer.auth.getUser(token)
    const email = normalizeEmail(userData.user?.email)
    if (userError || !email) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get username from database by email
    const user = await prisma.user.findFirst({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const username = user.username
    const seedIds = await prisma.seed.findMany({
      where: { authorUsername: username },
      select: { id: true }
    }).then(rows => rows.map(row => row.id))

    // Delete all related data in a single batch transaction.
    // This avoids keeping an interactive transaction open while executing many statements.
    await prisma.$transaction([
      prisma.like.deleteMany({
        where: { seedId: { in: seedIds } }
      }),
      prisma.favorite.deleteMany({
        where: { seedId: { in: seedIds } }
      }),
      prisma.report.deleteMany({
        where: { targetSeedId: { in: seedIds } }
      }),
      prisma.seed.deleteMany({
        where: { authorUsername: username }
      }),
      prisma.like.deleteMany({
        where: { userUsername: username }
      }),
      prisma.favorite.deleteMany({
        where: { userUsername: username }
      }),
      prisma.follow.deleteMany({
        where: {
          OR: [
            { followerUsername: username },
            { followingUsername: username }
          ]
        }
      }),
      prisma.report.deleteMany({
        where: {
          OR: [
            { reporterUsername: username },
            { targetUsername: username }
          ]
        }
      }),
      prisma.oAuthAccount.deleteMany({
        where: { userUsername: username }
      }),
      prisma.moderationLog.deleteMany({
        where: { moderatorUsername: username }
      }),
      prisma.user.deleteMany({
        where: { username }
      })
    ])

    // Delete user from Supabase Auth
    try {
      await supabaseServer.auth.admin.deleteUser(userData.user.id)
    } catch (err) {
      console.error('Failed to delete Supabase user:', err)
      // Continue anyway, database user is already deleted
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
