import SiteShell from '../../components/SiteShell'
import { ModerationActions } from '../../components/ModerationActions'
import { prisma } from '../../lib/prisma'
import { cookies } from 'next/headers'
import { resolveCurrentUser, hasModerationAccess } from '../../lib/auth'
import { ACCOUNT_USER_COOKIE_NAME, parseAccountCookieUser } from '../../lib/account-cookie'
import Link from 'next/link'
import SyncPBButton from '../../components/SyncPBButton'

export const dynamic = 'force-dynamic'

function getReportKindLabel(report: { targetSeedId?: number | null; targetUser?: { username: string } | null; note?: string | null }) {
  if (report.targetSeedId) return '投稿通報'
  if (report.targetUser) return 'ユーザー通報'

  const note = report.note ?? ''
  if (note.startsWith('[お問い合わせ]')) return 'お問い合わせ'
  if (note.startsWith('[バグ報告]')) return 'バグ報告'
  if (note.startsWith('[機能リクエスト]')) return '機能リクエスト'
  if (note.startsWith('[通報]')) return '通報'

  return 'お問い合わせ'
}

function stripNotePrefix(note: string | null | undefined) {
  if (!note) return '不明'

  return note.replace(/^\[(お問い合わせ|バグ報告|機能リクエスト|通報)\]\s*/, '')
}

function getReportTargetHref(report: {
  seed?: { author?: { username: string } | null; seedValue: string } | null
  targetUser?: { username: string } | null
}) {
  if (report.seed?.author?.username) {
    return `/seeds/${report.seed.author.username}/${report.seed.seedValue}`
  }

  if (report.targetUser?.username) {
    return `/users/${report.targetUser.username}`
  }

  return null
}

function getReportTargetLabel(report: {
  seed?: { author?: { username: string } | null; seedValue: string } | null
  targetUser?: { username: string } | null
}) {
  if (report.seed?.author?.username) {
    return `seed ${report.seed.seedValue}`
  }

  if (report.targetUser?.username) {
    return `@${report.targetUser.username}`
  }

  return '対象なし'
}

export default async function AdminPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  const currentUser = await resolveCurrentUser(accessToken)
  const accountUser = parseAccountCookieUser(cookieStore.get(ACCOUNT_USER_COOKIE_NAME)?.value)
  const canModerate = hasModerationAccess(currentUser) || hasModerationAccess(accountUser)

  if (!canModerate) {
    return (
      <SiteShell title="管理画面" subtitle="権限がありません。" icon="fa-shield-halved">
        <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-600">
          モデレーターまたは管理者のみアクセスできます。
        </div>
      </SiteShell>
    )
  }

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      reporter: { select: { username: true, email: true } },
      seed: { select: { id: true, seedValue: true, author: { select: { username: true } } } },
      targetUser: {
        select: {
          username: true,
          seeds: {
            select: { id: true, seedValue: true },
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    }
  })
  const moderationLogs = await prisma.moderationLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { moderator: { select: { username: true } } }
  })
  const seedCount = await prisma.seed.count()
  const userCount = await prisma.user.count()

  return (
    <SiteShell title="管理画面" subtitle="通報対応・警告・BAN・強制削除などの運用画面です。" icon="fa-shield-halved">
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-2xl bg-white border shadow-sm p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">通報一覧</h3>
            <div className="text-sm text-slate-500">通報 / お問い合わせ / {reports.length} 件</div>
          </div>
          <div className="mt-4 space-y-3">
            {reports.length === 0 ? (
              <div className="rounded-xl border p-4 text-sm text-slate-600">まだ通報はありません。</div>
            ) : reports.map(report => (
              <div key={report.id} className="rounded-xl border p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">{getReportKindLabel(report)}</div>
                  <div className="mt-1 text-sm text-slate-500 space-y-1">
                    <div>
                      対象:{' '}
                      {getReportTargetHref(report) ? (
                        <Link href={getReportTargetHref(report)!} className="font-medium text-primary-600 hover:underline">
                          {getReportTargetLabel(report)}
                        </Link>
                      ) : (
                        getReportTargetLabel(report)
                      )}
                    </div>
                    <div>
                      報告者: @{report.reporter.username}
                      {report.reporter.email ? ` (${report.reporter.email})` : ' (メール未設定)'}
                    </div>
                    <div>内容: {stripNotePrefix(report.note)}</div>
                  </div>
                </div>
                <ModerationActions report={report as any} />
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-white border shadow-sm p-5">
            <h3 className="font-semibold">サイト状況</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <div>・登録シード数: {seedCount.toLocaleString('ja-JP')}</div>
              <div>・登録ユーザー数: {userCount.toLocaleString('ja-JP')}</div>
              <div>・モデレーション履歴: {moderationLogs.length} 件表示中</div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border shadow-sm p-5">
            <h3 className="font-semibold">PB 同期（手動）</h3>
            <div className="mt-3 text-sm text-slate-600">
              <div className="mb-2">Speedrun.com の PB を即時取得して DB を更新します。モデレーター権限が必要です。</div>
              <SyncPBButton />
            </div>
          </div>

          <div className="rounded-2xl bg-white border shadow-sm p-5">
            <h3 className="font-semibold">BAN時の投稿処置</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <div>・残す / 削除 を投稿単位で選択</div>
              <div>・強制削除は即時反映</div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border shadow-sm p-5">
            <h3 className="font-semibold">モデレーション履歴</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {moderationLogs.length === 0 ? (
                <div>警告・BAN・却下のログを表示します。</div>
              ) : moderationLogs.map(log => (
                <div key={log.id} className="rounded-xl border bg-slate-50 p-3">
                  <div className="font-medium text-slate-800">{log.action}</div>
                  <div className="text-xs text-slate-500">@{log.moderator.username} / {new Date(log.createdAt).toLocaleDateString('ja-JP')}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </SiteShell>
  )
}