'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Modal from './Modal'

interface SeedActionButtonsProps {
  seedId: number
  username: string
  seedValue: string
  authorUsername: string
  currentUserUsername?: string | null
}

export default function SeedActionButtons({ 
  seedId, 
  username, 
  seedValue, 
  authorUsername,
  currentUserUsername
}: SeedActionButtonsProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const isOwner = currentUserUsername && authorUsername && currentUserUsername === authorUsername

  const handleDelete = () => {
    setShowConfirm(true)
  }

  const confirmDelete = async () => {
    setShowConfirm(false)
    setDeleting(true)
    setDeleteError('')

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError

      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        router.push('/login')
        throw new Error('ログインしてから削除してください')
      }

      const response = await fetch(`/api/seeds/id/${seedId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '削除に失敗しました')
      }

      router.push(`/users/${username}`)
    } catch (error: any) {
      setDeleteError(error?.message || '削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  if (!isOwner) {
    return null
  }

  return (
    <div className="rounded-2xl bg-white border shadow-sm p-5 space-y-3">
      <h3 className="font-semibold">投稿管理</h3>
      
      <button
        onClick={(e) => { e.stopPropagation(); router.push(`/seeds/edit/${seedId}`) }}
        className="w-full px-4 py-2 rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors text-sm font-semibold"
      >
        編集
      </button>

      {deleteError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {deleteError}
        </div>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); handleDelete() }}
        disabled={deleting}
        className="w-full px-4 py-2 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 transition-colors text-sm font-semibold disabled:opacity-50"
      >
        {deleting ? '削除中...' : '削除'}
      </button>
      <Modal
        open={showConfirm}
        title="シードを削除します"
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmDelete}
        confirmLabel="削除する"
        cancelLabel="キャンセル"
      >
        このシードを削除してもよろしいですか？この操作は取り消せません。
      </Modal>
    </div>
  )
}
