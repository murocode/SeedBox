import { prisma } from '../../../../lib/prisma'
import { supabase } from '../../../../lib/supabaseClient'
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
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user?.email) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get username from database by email
    const user = await prisma.user.findFirst({
      where: { email: userData.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const username = user.username

    // Delete all related data in a transaction
    await prisma.$transaction(async tx => {
      const seedIds = (await tx.seed.findMany({
        where: { authorUsername: username },
        select: { id: true }
      })).map(seed => seed.id)

      await tx.like.deleteMany({
        where: {
          seed: {
            authorUsername: username
          }
        }
      })

      await tx.favorite.deleteMany({
        where: {
          seed: {
            authorUsername: username
          }
        }
      })

      if (seedIds.length > 0) {
        await tx.report.deleteMany({
          where: {
            targetSeedId: {
              in: seedIds
            }
          }
        })
      }

      await tx.seed.deleteMany({
        where: { authorUsername: username }
      })

      await tx.like.deleteMany({
        where: { userUsername: username }
      })

      await tx.favorite.deleteMany({
        where: { userUsername: username }
      })

      await tx.follow.deleteMany({
        where: {
          OR: [
            { followerUsername: username },
            { followingUsername: username }
          ]
        }
      })

      await tx.report.deleteMany({
        where: { reporterUsername: username }
      })

      await tx.report.deleteMany({
        where: { targetUsername: username }
      })

      await tx.oAuthAccount.deleteMany({
        where: { userUsername: username }
      })

      await tx.moderationLog.deleteMany({
        where: { moderatorUsername: username }
      })

      await tx.user.delete({
        where: { username }
      })
    })

    // Delete user from Supabase Auth
    try {
      await supabase.auth.admin.deleteUser(userData.user.id)
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
