"use client"

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function SyncPBButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runSync() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      const res = await fetch('/api/admin/sync-pbs', {
        method: 'POST',
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError([data?.error, data?.details].filter(Boolean).join(': ') || `失敗しました (${res.status})`)
      } else {
        setResult(data)
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={runSync}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
      >
        {loading ? '実行中…' : 'PBを手動同期'}
      </button>

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

      {result && (
        <pre className="mt-2 max-h-40 overflow-auto text-xs bg-slate-50 p-2 border rounded">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  )
}
