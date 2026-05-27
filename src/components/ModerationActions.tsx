"use client"

import { useState } from 'react'

export interface Report {
  id: number
  reason: string
  targetSeedId?: number | null
  targetUserId?: number | null
  reporterUsername?: string
  reporter: { username: string }
  seed?: { id: number; seedValue: string; author: { username: string } } | null
  targetUser?: { username: string; seeds?: { id: number; seedValue: string }[] } | null
  createdAt: Date
}

export function ModerationActions({ report }: { report: Report }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [removeSeeds, setRemoveSeeds] = useState<number[]>(report.seed?.id ? [report.seed.id] : [])

  function toggleSeed(seedId: number) {
    setRemoveSeeds(prev => prev.includes(seedId) ? prev.filter(id => id !== seedId) : [...prev, seedId])
  }

  async function handleAction(action: 'WARNING' | 'BAN' | 'DISMISS') {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/moderation/report', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: report.id,
          action,
          removeSeeds: action === 'BAN' ? removeSeeds : undefined
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Refresh page
      window.location.reload()
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <div className="text-xs text-red-600">{error}</div>}

      {report.targetUser?.seeds && report.targetUser.seeds.length > 0 && (
        <div className="rounded-lg border bg-slate-50 p-3 text-xs text-slate-600 space-y-2">
          <div className="font-semibold text-slate-800">BAN時に削除する投稿</div>
          {report.targetUser.seeds.map(seed => (
            <label key={seed.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={removeSeeds.includes(seed.id)}
                onChange={() => toggleSeed(seed.id)}
              />
              <span>seed {seed.seedValue}</span>
            </label>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          disabled={loading}
          onClick={() => handleAction('WARNING')}
          className="btn btn-secondary text-sm disabled:opacity-50"
        >
          警告
        </button>
        <button
          disabled={loading}
          onClick={() => handleAction('BAN')}
          className="btn btn-danger text-sm disabled:opacity-50"
        >
          BAN
        </button>
        <button
          disabled={loading}
          onClick={() => handleAction('DISMISS')}
          className="btn btn-secondary text-sm disabled:opacity-50"
        >
          却下
        </button>
      </div>
    </div>
  )
}
