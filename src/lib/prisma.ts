import { Prisma, PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

function getPrismaDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    return undefined
  }

  const url = new URL(databaseUrl)
  const hostname = url.hostname.toLowerCase()
  const isLocalDatabase = ['localhost', '127.0.0.1', '::1'].includes(hostname)
  const isSupabasePooler =
    hostname.includes('pooler.supabase.com') || url.port === '6543' || url.searchParams.get('pgbouncer') === 'true'

  if (!isLocalDatabase && !url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', '1')
  }

  if (isSupabasePooler) {
    if (!url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true')
    }
  }

  return url.toString()
}

const requiredTables = [
  'User',
  'OAuthAccount',
  'Seed',
  'Like',
  'Favorite',
  'Follow',
  'Report',
  'ModerationLog'
]

const prismaDatabaseUrl = getPrismaDatabaseUrl()
const basePrisma = globalThis.prisma ?? new PrismaClient(
  prismaDatabaseUrl
    ? {
        datasources: {
          db: {
            url: prismaDatabaseUrl
          }
        }
      }
    : undefined
)
if (process.env.NODE_ENV !== 'production') globalThis.prisma = basePrisma

let bootstrapPromise: Promise<void> | null = null

const schemaBootstrapStatements = [
  `DO $$ BEGIN CREATE TYPE "Ease" AS ENUM ('EASY', 'NORMAL', 'HARD'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE TYPE "Distance" AS ENUM ('NEAR', 'NORMAL', 'FAR'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE TYPE "PortalEase" AS ENUM ('EASY', 'HARD'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE TYPE "ZeroCycleDifficulty" AS ENUM ('EASY', 'HARD'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE TYPE "ReportReason" AS ENUM ('MISINFO', 'SPAM', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE TYPE "ModerationAction" AS ENUM ('WARNING', 'BAN', 'DISMISS', 'REMOVE_SEED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `CREATE TABLE IF NOT EXISTS "User" (
    "username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT,
    "avatarUrl" TEXT,
    "speedrunId" TEXT,
    "pbTime" DOUBLE PRECISION,
    "pbUpdatedAt" TIMESTAMP(3),
    "isBanned" BOOLEAN NOT NULL DEFAULT FALSE,
    "bio" TEXT,
    "youtubeUrl" TEXT,
    "twitter_url" TEXT,
    "twitchUrl" TEXT,
    "websiteUrl" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("username")
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User" ("email");`,
  `DO $$ BEGIN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'User'
        AND column_name = 'pbTime'
        AND data_type <> 'double precision'
    ) THEN
      ALTER TABLE "User" ALTER COLUMN "pbTime" TYPE DOUBLE PRECISION USING "pbTime"::DOUBLE PRECISION;
    END IF;
  END $$;`,
  `CREATE TABLE IF NOT EXISTS "OAuthAccount" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "userUsername" TEXT NOT NULL,
    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "OAuthAccount_provider_providerAccountId_key" ON "OAuthAccount" ("provider", "providerAccountId");`,
  `CREATE TABLE IF NOT EXISTS "Seed" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seedValue" TEXT NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "owEase" "Ease",
    "owTypes" TEXT[] NOT NULL,
    "villageType" TEXT,
    "hasBlacksmith" BOOLEAN,
    "netherEase" "Ease" NOT NULL,
    "fortressDistance" "Distance" NOT NULL,
    "fortressTypes" TEXT[] NOT NULL,
    "fortressToNetherDist" "Distance" NOT NULL,
    "portalRoomEase" "PortalEase" NOT NULL,
    "zeroCycle" "ZeroCycleDifficulty" NOT NULL,
    "authorUsername" TEXT NOT NULL,
    CONSTRAINT "Seed_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE INDEX IF NOT EXISTS "Seed_seedValue_idx" ON "Seed" ("seedValue");`,
  `CREATE INDEX IF NOT EXISTS "Seed_authorUsername_idx" ON "Seed" ("authorUsername");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Seed_seedValue_authorUsername_key" ON "Seed" ("seedValue", "authorUsername");`,
  `CREATE TABLE IF NOT EXISTS "Like" (
    "id" SERIAL NOT NULL,
    "userUsername" TEXT NOT NULL,
    "seedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Like_userUsername_seedId_key" ON "Like" ("userUsername", "seedId");`,
  `CREATE TABLE IF NOT EXISTS "Favorite" (
    "id" SERIAL NOT NULL,
    "userUsername" TEXT NOT NULL,
    "seedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_userUsername_seedId_key" ON "Favorite" ("userUsername", "seedId");`,
  `CREATE TABLE IF NOT EXISTS "Follow" (
    "id" SERIAL NOT NULL,
    "followerUsername" TEXT NOT NULL,
    "followingUsername" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Follow_followerUsername_followingUsername_key" ON "Follow" ("followerUsername", "followingUsername");`,
  `CREATE TABLE IF NOT EXISTS "Report" (
    "id" SERIAL NOT NULL,
    "reporterUsername" TEXT NOT NULL,
    "targetSeedId" INTEGER,
    "targetUsername" TEXT,
    "reason" "ReportReason" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE TABLE IF NOT EXISTS "ModerationLog" (
    "id" SERIAL NOT NULL,
    "moderatorUsername" TEXT NOT NULL,
    "action" "ModerationAction" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("id")
  );`
]

const schemaMaintenanceStatements = [
  `DO $$ BEGIN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'User'
        AND column_name = 'pbTime'
        AND data_type <> 'double precision'
    ) THEN
      ALTER TABLE "User" ALTER COLUMN "pbTime" TYPE DOUBLE PRECISION USING "pbTime"::DOUBLE PRECISION;
    END IF;
  END $$;`
]

async function bootstrapDatabase() {
  const rows = await basePrisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (${Prisma.join(requiredTables)})
  `

  const existingTables = new Set(rows.map(row => row.table_name))
  const hasAllTables = requiredTables.every(tableName => existingTables.has(tableName))
  if (!hasAllTables) {
    for (const statement of schemaBootstrapStatements) {
      await basePrisma.$executeRawUnsafe(statement)
    }
  }

  for (const statement of schemaMaintenanceStatements) {
    await basePrisma.$executeRawUnsafe(statement)
  }
}

async function ensureDatabaseReady() {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapDatabase().catch(error => {
      bootstrapPromise = null
      throw error
    })
  }

  return bootstrapPromise
}

function wrapCallable<T extends (...args: any[]) => any>(target: T) {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    await ensureDatabaseReady()
    return target(...args)
  }
}

function createAutoBootstrappedPrisma(client: PrismaClient) {
  return new Proxy(client, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver)

      if (typeof value === 'function') {
        return wrapCallable(value.bind(target))
      }

      if (value && typeof value === 'object') {
        return new Proxy(value, {
          get(delegateTarget, delegateProperty, delegateReceiver) {
            const delegateValue = Reflect.get(delegateTarget, delegateProperty, delegateReceiver)

            if (typeof delegateValue === 'function') {
              return wrapCallable(delegateValue.bind(delegateTarget))
            }

            return delegateValue
          }
        })
      }

      return value
    }
  }) as PrismaClient
}

export const prisma = createAutoBootstrappedPrisma(basePrisma)
