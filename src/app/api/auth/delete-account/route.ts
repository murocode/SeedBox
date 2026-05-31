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

    // Delete all related data in a single interactive transaction.
    // This keeps the raw deletes atomic without relying on batch-array promise typing.
    await prisma.$transaction(async tx => {
      await tx.$executeRaw`
        DELETE FROM "Like"
        WHERE "seedId" IN (
          SELECT id FROM "Seed" WHERE "authorUsername" = ${username}
        )
      `
      await tx.$executeRaw`
        DELETE FROM "Favorite"
        WHERE "seedId" IN (
          SELECT id FROM "Seed" WHERE "authorUsername" = ${username}
        )
      `
      await tx.$executeRaw`
        DELETE FROM "Report"
        WHERE "targetSeedId" IN (
          SELECT id FROM "Seed" WHERE "authorUsername" = ${username}
        )
      `
      await tx.$executeRaw`
        DELETE FROM "Seed"
        WHERE "authorUsername" = ${username}
      `
      await tx.$executeRaw`
        DELETE FROM "Like"
        WHERE "userUsername" = ${username}
      `
      await tx.$executeRaw`
        DELETE FROM "Favorite"
        WHERE "userUsername" = ${username}
      `
      await tx.$executeRaw`
        DELETE FROM "Follow"
        WHERE "followerUsername" = ${username}
           OR "followingUsername" = ${username}
      `
      await tx.$executeRaw`
        DELETE FROM "Report"
        WHERE "reporterUsername" = ${username}
      `
      await tx.$executeRaw`
        DELETE FROM "Report"
        WHERE "targetUsername" = ${username}
      `
      await tx.$executeRaw`
        DELETE FROM "OAuthAccount"
        WHERE "userUsername" = ${username}
      `
      await tx.$executeRaw`
        DELETE FROM "ModerationLog"
        WHERE "moderatorUsername" = ${username}
      `
      await tx.$executeRaw`
        DELETE FROM "User"
        WHERE "username" = ${username}
      `
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
