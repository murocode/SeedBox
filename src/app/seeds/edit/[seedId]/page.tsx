'use client'

import SiteShellClient from '../../../../components/SiteShellClient'
import { useRouter, useParams } from 'next/navigation'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabaseClient'

interface Seed {
  id: number
  seedValue: string
  title: string
  comment: string
  owEase: string | null
  owTypes: string[]
  villageType: string | null
  hasBlacksmith: boolean | null
  netherEase: string
  fortressDistance: string
  fortressTypes: string[]
  fortressToNetherDist: string
  portalRoomEase: string
  zeroCycle: string
  author: { username: string; avatarUrl: string | null }
}

interface FormState {
  title: string
  comment: string
  owEase: string
  owTypes: string[]
  villageType: string
  hasBlacksmith: string
  netherEase: string
  fortressDistance: string
  fortressTypes: string[]
  fortressNetherDistance: string
  portalRoomEase: string
  zeroCycle: string
}

export default function SeedEditPage() {
  const router = useRouter()
  const params = useParams()
  const seedId = params.seedId as string
  
  const [seed, setSeed] = useState<Seed | null>(null)
  const [form, setForm] = useState<FormState>({
    title: '',
    comment: '',
    owEase: '',
    owTypes: [],
    villageType: '',
    hasBlacksmith: '',
    netherEase: '',
    fortressDistance: '',
    fortressTypes: [],
    fortressNetherDistance: '',
    portalRoomEase: '',
    zeroCycle: ''
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [expandedSections, setExpandedSections] = useState({
    overworld: true,
    nether: true,
    end: true
  })

  useEffect(() => {
    async function fetchSeed() {
      try {
        const response = await fetch(`/api/seeds/id/${seedId}`)
        if (!response.ok) {
          throw new Error('シードの読み込みに失敗しました')
        }
        const data = await response.json()
        setSeed(data.seed)

        // フォームに値を設定
        setForm({
          title: data.seed.title || '',
          comment: data.seed.comment || '',
          owEase: reverseMapEase(data.seed.owEase) || '',
          owTypes: data.seed.owTypes || [],
          villageType: data.seed.villageType || '',
          hasBlacksmith: reverseMapBoolean(data.seed.hasBlacksmith) || '',
          netherEase: reverseMapEase(data.seed.netherEase) || '',
          fortressDistance: reverseMapDistance(data.seed.fortressDistance) || '',
          fortressTypes: data.seed.fortressTypes || [],
          fortressNetherDistance: reverseMapDistance(data.seed.fortressToNetherDist) || '',
          portalRoomEase: reverseMapPortalEase(data.seed.portalRoomEase) || '',
          zeroCycle: reverseMapZeroCycle(data.seed.zeroCycle) || ''
        })
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'シードの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchSeed()
  }, [seedId])

  const handleInputChange = (field: keyof FormState, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const toggleArrayField = (field: 'owTypes' | 'fortressTypes', value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const showVillageFields = form.owTypes.includes('村')

  const canSubmit = Boolean(form.title.trim())

  const ToggleButton = ({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      type="button"
      className={`px-3 py-2 rounded-lg border transition-colors text-sm ${
        isActive
          ? 'bg-primary-600 text-white border-primary-600'
          : 'bg-white border-slate-300 text-slate-700 hover:border-primary-600'
      }`}
    >
      {label}
    </button>
  )

  const SectionHeader = ({ title, expanded, badgeCount, onToggle }: { title: string; expanded: boolean; badgeCount: number; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      type="button"
      className="w-full flex items-center justify-between py-3 px-4 hover:bg-slate-50 transition-colors border-b last:border-b-0"
    >
      <div className="flex items-center gap-2">
        <svg
          className={`w-5 h-5 text-slate-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        <span className="font-semibold text-slate-900">{title}</span>
      </div>
      {badgeCount > 0 && (
        <span className="inline-block bg-primary-600 text-white text-xs font-semibold rounded-full px-2 py-1">
          {badgeCount}
        </span>
      )}
    </button>
  )

  const mapEase = (value: string) => {
    if (value === '走りやすい') return 'EASY'
    if (value === '普通') return 'NORMAL'
    if (value === '走りにくい') return 'HARD'
    return undefined
  }

  const mapDistance = (value: string) => {
    if (value === '近い') return 'NEAR'
    if (value === '普通') return 'NORMAL'
    if (value === '遠い') return 'FAR'
    return undefined
  }

  const mapPortalEase = (value: string) => {
    if (value === '見つけやすい') return 'EASY'
    if (value === '見つけにくい') return 'HARD'
    return undefined
  }

  const mapZeroCycle = (value: string) => {
    if (value === '簡単') return 'EASY'
    if (value === '難しい') return 'HARD'
    return undefined
  }

  const mapBoolean = (value: string) => {
    if (value === 'あり') return true
    if (value === 'なし') return false
    return undefined
  }

  const reverseMapEase = (value: string | null) => {
    if (value === 'EASY') return '走りやすい'
    if (value === 'NORMAL') return '普通'
    if (value === 'HARD') return '走りにくい'
    return ''
  }

  const reverseMapDistance = (value: string | null) => {
    if (value === 'NEAR') return '近い'
    if (value === 'NORMAL') return '普通'
    if (value === 'FAR') return '遠い'
    return ''
  }

  const reverseMapPortalEase = (value: string | null) => {
    if (value === 'EASY') return '見つけやすい'
    if (value === 'HARD') return '見つけにくい'
    return ''
  }

  const reverseMapZeroCycle = (value: string | null) => {
    if (value === 'EASY') return '簡単'
    if (value === 'HARD') return '難しい'
    return ''
  }

  const reverseMapBoolean = (value: boolean | null) => {
    if (value === true) return 'あり'
    if (value === false) return 'なし'
    return ''
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')

    if (!form.title.trim()) {
      setSubmitError('タイトルは必須です')
      return
    }

    setSubmitting(true)

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError

      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        router.push('/login')
        throw new Error('ログインしてから編集してください')
      }

      const response = await fetch(`/api/seeds/id/${seedId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          title: form.title,
          comment: form.comment,
          owEase: mapEase(form.owEase),
          owTypes: form.owTypes,
          villageType: form.villageType || null,
          hasBlacksmith: mapBoolean(form.hasBlacksmith),
          netherEase: mapEase(form.netherEase),
          fortressDistance: mapDistance(form.fortressDistance),
          fortressTypes: form.fortressTypes,
          fortressToNetherDist: mapDistance(form.fortressNetherDistance),
          portalRoomEase: mapPortalEase(form.portalRoomEase),
          zeroCycle: mapZeroCycle(form.zeroCycle)
        })
      })

      const responseData = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(responseData.error || '編集に失敗しました')
      }

      setSubmitSuccess('編集しました')
      setTimeout(() => {
        router.push(`/seeds/${seed?.author.username}/${seed?.seedValue}`)
      }, 1000)
    } catch (error: any) {
      setSubmitError(error?.message || '編集に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <SiteShellClient title="シード編集" subtitle="読み込み中..." icon="fa-pen-to-square">
        <div className="rounded-2xl bg-white border shadow-sm p-8 text-center text-slate-600">
          読み込み中...
        </div>
      </SiteShellClient>
    )
  }

  if (!seed) {
    return (
      <SiteShellClient title="シード編集" subtitle="エラーが発生しました" icon="fa-pen-to-square">
        <div className="rounded-2xl bg-white border shadow-sm p-8 text-center text-slate-600">
          {submitError || 'シードが見つかりません'}
        </div>
      </SiteShellClient>
    )
  }

  return (
    <SiteShellClient title="シード編集" subtitle={`Seed: ${seed.seedValue}`} icon="fa-pen-to-square">
      <div className="grid lg:grid-cols-12 gap-6">
        <form className="lg:col-span-8 space-y-4" onSubmit={handleSubmit}>
          {/* 基本情報セクション */}
          <div className="rounded-2xl bg-white border shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-lg text-slate-900">基本情報</h3>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">タイトル *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => handleInputChange('title', e.target.value)}
                placeholder="例: 村＋鍛冶屋のシード"
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">コメント</label>
              <textarea
                value={form.comment}
                onChange={e => handleInputChange('comment', e.target.value)}
                placeholder="シードについての詳細な説明（Markdown対応・1000文字以内）"
                maxLength={1000}
                className="w-full rounded-lg border px-3 py-2 min-h-28 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <div className="text-xs text-slate-500 mt-1">{form.comment.length} / 1000</div>
            </div>
          </div>

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>
          )}

          {submitSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{submitSuccess}</div>
          )}

          {/* タグセクション */}
          <div className="rounded-2xl bg-white border shadow-sm overflow-hidden">
            <div>
              <SectionHeader
                title="オーバーワールド"
                expanded={expandedSections.overworld}
                badgeCount={[form.owEase, ...form.owTypes, form.villageType, form.hasBlacksmith].filter(Boolean).length}
                onToggle={() => toggleSection('overworld')}
              />
              {expandedSections.overworld && (
                <div className="px-4 py-3 bg-slate-50 space-y-3 border-t">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">走りやすさ</label>
                    <div className="grid grid-cols-3 gap-2">
                      <ToggleButton label="走りやすい" isActive={form.owEase === '走りやすい'} onClick={() => handleInputChange('owEase', form.owEase === '走りやすい' ? '' : '走りやすい')} />
                      <ToggleButton label="普通" isActive={form.owEase === '普通'} onClick={() => handleInputChange('owEase', form.owEase === '普通' ? '' : '普通')} />
                      <ToggleButton label="走りにくい" isActive={form.owEase === '走りにくい'} onClick={() => handleInputChange('owEase', form.owEase === '走りにくい' ? '' : '走りにくい')} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">オーバーワールドのタイプ</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['村', 'ピラミッド', '埋もれた宝', '難破船', '荒廃したポータル', 'その他'].map(type => (
                        <ToggleButton key={type} label={type} isActive={form.owTypes.includes(type)} onClick={() => toggleArrayField('owTypes', type)} />
                      ))}
                    </div>
                  </div>

                  {showVillageFields && (
                    <>
                      <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-2">村のタイプ</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['平原', '砂漠', 'サバンナ', '雪原', 'タイガ'].map(type => (
                            <ToggleButton
                              key={type}
                              label={type}
                              isActive={form.villageType === type}
                              onClick={() => handleInputChange('villageType', form.villageType === type ? '' : type)}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-2">鍛冶屋の有無</label>
                        <div className="grid grid-cols-2 gap-2">
                          <ToggleButton label="あり" isActive={form.hasBlacksmith === 'あり'} onClick={() => handleInputChange('hasBlacksmith', form.hasBlacksmith === 'あり' ? '' : 'あり')} />
                          <ToggleButton label="なし" isActive={form.hasBlacksmith === 'なし'} onClick={() => handleInputChange('hasBlacksmith', form.hasBlacksmith === 'なし' ? '' : 'なし')} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div>
              <SectionHeader
                title="ネザー"
                expanded={expandedSections.nether}
                badgeCount={[form.netherEase, form.fortressDistance, ...form.fortressTypes, form.fortressNetherDistance].filter(Boolean).length}
                onToggle={() => toggleSection('nether')}
              />
              {expandedSections.nether && (
                <div className="px-4 py-3 bg-slate-50 space-y-3 border-t">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">ネザーの走りやすさ</label>
                    <div className="grid grid-cols-3 gap-2">
                      <ToggleButton label="走りやすい" isActive={form.netherEase === '走りやすい'} onClick={() => handleInputChange('netherEase', form.netherEase === '走りやすい' ? '' : '走りやすい')} />
                      <ToggleButton label="普通" isActive={form.netherEase === '普通'} onClick={() => handleInputChange('netherEase', form.netherEase === '普通' ? '' : '普通')} />
                      <ToggleButton label="走りにくい" isActive={form.netherEase === '走りにくい'} onClick={() => handleInputChange('netherEase', form.netherEase === '走りにくい' ? '' : '走りにくい')} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">廃要塞の距離</label>
                    <div className="grid grid-cols-3 gap-2">
                      <ToggleButton label="近い" isActive={form.fortressDistance === '近い'} onClick={() => handleInputChange('fortressDistance', form.fortressDistance === '近い' ? '' : '近い')} />
                      <ToggleButton label="普通" isActive={form.fortressDistance === '普通'} onClick={() => handleInputChange('fortressDistance', form.fortressDistance === '普通' ? '' : '普通')} />
                      <ToggleButton label="遠い" isActive={form.fortressDistance === '遠い'} onClick={() => handleInputChange('fortressDistance', form.fortressDistance === '遠い' ? '' : '遠い')} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">廃要塞のタイプ</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['ブリッジ', 'ステーブル', 'ハウジング', 'トレジャー'].map(type => (
                        <ToggleButton key={type} label={type} isActive={form.fortressTypes.includes(type)} onClick={() => toggleArrayField('fortressTypes', type)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">廃要塞とネザー要塞の距離</label>
                    <div className="grid grid-cols-2 gap-2">
                      <ToggleButton label="近い" isActive={form.fortressNetherDistance === '近い'} onClick={() => handleInputChange('fortressNetherDistance', form.fortressNetherDistance === '近い' ? '' : '近い')} />
                      <ToggleButton label="遠い" isActive={form.fortressNetherDistance === '遠い'} onClick={() => handleInputChange('fortressNetherDistance', form.fortressNetherDistance === '遠い' ? '' : '遠い')} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <SectionHeader
                title="エンド"
                expanded={expandedSections.end}
                badgeCount={[form.portalRoomEase, form.zeroCycle].filter(Boolean).length}
                onToggle={() => toggleSection('end')}
              />
              {expandedSections.end && (
                <div className="px-4 py-3 bg-slate-50 space-y-3 border-t">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">ポータル部屋の見つけやすさ</label>
                    <div className="grid grid-cols-2 gap-2">
                      <ToggleButton label="見つけやすい" isActive={form.portalRoomEase === '見つけやすい'} onClick={() => handleInputChange('portalRoomEase', form.portalRoomEase === '見つけやすい' ? '' : '見つけやすい')} />
                      <ToggleButton label="見つけにくい" isActive={form.portalRoomEase === '見つけにくい'} onClick={() => handleInputChange('portalRoomEase', form.portalRoomEase === '見つけにくい' ? '' : '見つけにくい')} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">ゼロサイクル</label>
                    <div className="grid grid-cols-2 gap-2">
                      <ToggleButton label="簡単" isActive={form.zeroCycle === '簡単'} onClick={() => handleInputChange('zeroCycle', form.zeroCycle === '簡単' ? '' : '簡単')} />
                      <ToggleButton label="難しい" isActive={form.zeroCycle === '難しい'} onClick={() => handleInputChange('zeroCycle', form.zeroCycle === '難しい' ? '' : '難しい')} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="w-full btn btn-primary disabled:opacity-50"
          >
            {submitting ? '編集中...' : '編集を保存'}
          </button>
        </form>

        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-white border shadow-sm p-5">
            <h3 className="font-semibold mb-3">投稿者</h3>
            <div className="flex items-center gap-3">
              {seed.author.avatarUrl && (
                <img src={seed.author.avatarUrl} alt={seed.author.username} className="w-10 h-10 rounded-full" />
              )}
              <div>
                <div className="font-semibold text-slate-900">{seed.author.username}</div>
                <div className="text-xs text-slate-500">Seed: {seed.seedValue}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </SiteShellClient>
  )
}
