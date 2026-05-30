'use client'

import SiteShellClient from '../../../components/SiteShellClient'
import { useRouter } from 'next/navigation'
import type { FormEvent, KeyboardEvent } from 'react'
import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { validateSeedValue } from '../../../lib/validation'

interface FormState {
  seed: string
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

export default function SeedNewPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    seed: '',
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
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [seedError, setSeedError] = useState('')

  const [expandedSections, setExpandedSections] = useState({
    overworld: true,
    nether: true,
    end: true
  })

  const handleInputChange = (field: keyof FormState, value: any) => {
    if (field === 'seed') {
      setForm(prev => ({ ...prev, seed: value }))
      const v = typeof value === 'string' ? value.trim() : ''
      if (!v) {
        setSeedError('必須項目です')
      } else if (!validateSeedValue(v)) {
        setSeedError('整数で入力してください（マイナスも可）')
      } else {
        setSeedError('')
      }
      return
    }

    setForm(prev => ({ ...prev, [field]: value }))
  }

  const seedKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab', 'Home', 'End']
    if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return
    const isMinus = e.key === '-'
    const isDigit = /^\d$/.test(e.key)
    if (!isDigit && !isMinus) {
      e.preventDefault()
      return
    }
    const el = e.currentTarget as HTMLInputElement
    if (isMinus) {
      if (el.selectionStart !== 0 || el.value.includes('-')) {
        e.preventDefault()
      }
    }
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')

    const errors: string[] = []
    if (!form.seed.trim() || seedError) errors.push('Seed値')
    if (!form.title.trim()) errors.push('タイトル')

    if (errors.length > 0) {
      setSubmitError(`必須項目を入力してください: ${errors.join(', ')}`)
      return
    }


    setSubmitting(true)

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError

      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        router.push('/login')
        throw new Error('ログインしてから投稿してください')
      }

      const syncResponse = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, persist_oauth_accounts: false })
      })

      const syncData = await syncResponse.json().catch(() => ({}))
      if (!syncResponse.ok) {
        throw new Error(syncData.error || 'ユーザー同期に失敗しました')
      }

      const response = await fetch('/api/seeds', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          seedValue: form.seed,
          title: form.title,
          comment: form.comment,
          owEase: mapEase(form.owEase),
          owTypes: form.owTypes,
          villageType: form.villageType,
          hasBlacksmith: mapBoolean(form.hasBlacksmith),
          netherEase: mapEase(form.netherEase),
          fortressDistance: mapDistance(form.fortressDistance),
          fortressTypes: form.fortressTypes,
          fortressNetherDistance: mapDistance(form.fortressNetherDistance),
          portalRoomEase: mapPortalEase(form.portalRoomEase),
          zeroCycle: mapZeroCycle(form.zeroCycle)
        })
      })

      const responseData = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(responseData.error || '投稿に失敗しました')
      }

      setSubmitSuccess('投稿しました')
      if (responseData.seed?.author?.username && responseData.seed?.seedValue) {
        router.push(`/seeds/${responseData.seed.author.username}/${responseData.seed.seedValue}`)
      }
    } catch (error: any) {
      setSubmitError(error?.message || '投稿に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SiteShellClient title="投稿作成" subtitle="新しいシードを登録します" icon="fa-plus">
      <div className="grid lg:grid-cols-12 gap-6">
        <form className="lg:col-span-8 space-y-4" onSubmit={handleSubmit}>
          {/* 基本情報セクション */}
          <div className="rounded-2xl bg-white border shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-lg text-slate-900">基本情報</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Seed 値 *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9\-]*"
                  aria-invalid={!!seedError}
                  value={form.seed}
                  onChange={e => handleInputChange('seed', e.target.value)}
                  onKeyDown={seedKeyDown}
                  placeholder="例: 123456789"
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
                {seedError ? (
                  <div className="text-xs text-red-600 mt-1">{seedError}</div>
                ) : null}
              </div>
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
                        <select
                          value={form.villageType}
                          onChange={e => handleInputChange('villageType', e.target.value)}
                          className="w-full rounded-lg border px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-600"
                        >
                          <option value="">選択してください</option>
                          <option value="平原">平原</option>
                          <option value="砂漠">砂漠</option>
                          <option value="サバンナ">サバンナ</option>
                          <option value="雪原">雪原</option>
                          <option value="タイガ">タイガ</option>
                        </select>
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
                    <label className="text-sm font-semibold text-slate-700 block mb-2">走りやすさ</label>
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

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-3">{submitError}</div>
          )}

          {submitSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 mb-3">{submitSuccess}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting || !!seedError || !form.seed.trim()}
          >
            {submitting ? '投稿中...' : '投稿する'}
          </button>
        </form>

        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-white border shadow-sm p-5 sticky top-24">
            <h3 className="font-semibold text-slate-900 mb-3">入力ガイド</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex gap-2">
                <span className="text-primary-600 font-bold">*</span>
                <span>必須項目です</span>
              </div>
              <div>・タグは投稿者の主観で選択してください</div>
              <div>・同一ユーザーによる同一シードの重複投稿は不可</div>  
              <div>・現在は1.16.1のシードのみ対応しています。他のバージョンのシードは入力しないでください。</div>          
            </div>

            <div className="mt-5 pt-5 border-t">
              <div className="font-semibold text-slate-900 mb-3">選択中のタグ</div>
              <div className="flex flex-wrap gap-2">
                {[
                  form.owEase && `OW: ${form.owEase}`,
                  form.owTypes.length > 0 && `OWタイプ: ${form.owTypes.join(', ')}`,
                  form.villageType && `村: ${form.villageType}`,
                  form.hasBlacksmith && `鍛冶屋: ${form.hasBlacksmith}`,
                  form.netherEase && `ネザー: ${form.netherEase}`,
                  form.fortressDistance && `廃要塞距離: ${form.fortressDistance}`,
                  form.fortressTypes.length > 0 && `廃要塞タイプ: ${form.fortressTypes.join(', ')}`,
                  form.fortressNetherDistance && `廃要塞-要塞距離: ${form.fortressNetherDistance}`,
                  form.portalRoomEase && `ポータル: ${form.portalRoomEase}`,
                  form.zeroCycle && `ゼロサイクル: ${form.zeroCycle}`
                ]
                  .filter(Boolean)
                  .map((tag, idx) => (
                    <div key={idx} className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                      {tag}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </SiteShellClient>
  )
}