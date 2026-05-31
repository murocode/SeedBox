"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import SeedGrid from './SeedGrid'
import SeedGridSkeleton from './SeedGridSkeleton'
import Accordion from './Accordion'
import type { DistanceValue, EaseValue, PortalEaseValue, ZeroCycleValue } from '../lib/seed-domain'

type Seed = {
  id: number
  seedValue: string
  title?: string | null
  comment?: string | null
  author?: { username?: string | null; avatarUrl?: string | null }
  owEase?: EaseValue | null
  villageType?: string
  hasBlacksmith?: boolean
  netherEase?: EaseValue | null
  fortressDistance?: DistanceValue | null
  fortressToNetherDist?: DistanceValue | null
  portalRoomEase?: PortalEaseValue | null
  zeroCycle?: ZeroCycleValue | null
  _count?: { likes?: number; favorites?: number }
}

const OW_TYPE_OPTIONS = ['村', 'ピラミッド', '埋もれた宝', '難破船', '荒廃したポータル', 'その他']
const FORTRESS_TYPE_OPTIONS = ['ブリッジ', 'ステーブル', 'ハウジング', 'トレジャー']

type FilterState = {
  searchText: string
  seedValue: string
  author: string
  owEase: string
  owTypes: string[]
  villageType: string
  hasBlacksmith: string
  netherEase: string
  fortressDistance: string
  fortressTypes: string[]
  fortressToNetherDist: string
  portalRoomEase: string
  zeroCycle: string
  orderBy: string
  followingOnly: string
}

const DEFAULTS: FilterState = {
  searchText: '',
  seedValue: '',
  author: '',
  owEase: '',
  owTypes: [],
  villageType: '',
  hasBlacksmith: '',
  netherEase: '',
  fortressDistance: '',
  fortressTypes: [],
  fortressToNetherDist: '',
  portalRoomEase: '',
  zeroCycle: '',
  orderBy: 'createdAt',
  followingOnly: ''
}

function readList(searchParams: ReturnType<typeof useSearchParams>, key: string) {
  const values = searchParams.getAll(key)
  if (values.length > 0) {
    return values.flatMap(value => value.split(',')).map(value => value.trim()).filter(Boolean)
  }

  const single = searchParams.get(key)
  if (!single) return []
  return single.split(',').map(value => value.trim()).filter(Boolean)
}

function readState(searchParams: ReturnType<typeof useSearchParams>): FilterState {
  return {
    searchText: searchParams.get('search') || searchParams.get('query') || '',
    seedValue: searchParams.get('seedValue') || '',
    author: searchParams.get('author') || '',
    owEase: searchParams.get('owEase') || '',
    owTypes: readList(searchParams, 'owTypes'),
    villageType: searchParams.get('villageType') || '',
    hasBlacksmith: searchParams.get('hasBlacksmith') || '',
    netherEase: searchParams.get('netherEase') || '',
    fortressDistance: searchParams.get('fortressDistance') || '',
    fortressTypes: readList(searchParams, 'fortressTypes'),
    fortressToNetherDist: searchParams.get('fortressToNetherDist') || '',
    portalRoomEase: searchParams.get('portalRoomEase') || '',
    zeroCycle: searchParams.get('zeroCycle') || '',
    orderBy: searchParams.get('orderBy') || 'createdAt',
    followingOnly: searchParams.get('followingOnly') || ''
  }
}

export default function SeedSearchBoard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [filters, setFilters] = useState<FilterState>(() => readState(searchParams))
  const [results, setResults] = useState<Seed[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => params.append(key, item))
        return
      }

      if (value && value !== DEFAULTS[key as keyof FilterState]) params.set(key, value)
    })
    return params.toString()
  }, [filters])

  useEffect(() => {
    const controller = new AbortController()

    async function loadSeeds() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`/api/seeds${queryString ? `?${queryString}` : ''}`, {
          signal: controller.signal
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        setResults(Array.isArray(data.seeds) ? data.seeds : [])
      } catch (fetchError: any) {
        if (fetchError?.name === 'AbortError') return
        console.error(fetchError)
        setError('API 取得に失敗しました')
        setResults([])
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadSeeds()
    return () => controller.abort()
  }, [queryString])

  useEffect(() => {
    setFilters(readState(searchParams))
  }, [searchParams])

  function updateField<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function toggleMultiValue(key: 'owTypes' | 'fortressTypes', value: string) {
    setFilters(prev => {
      const current = prev[key]
      const next = current.includes(value) ? current.filter(item => item !== value) : [...current, value]
      return { ...prev, [key]: next }
    })
  }

  function isSelected(key: 'owTypes' | 'fortressTypes', value: string) {
    return filters[key].includes(value)
  }

  function applyFilters() {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => params.append(key, item))
        return
      }

      if (value) params.set(key, value)
    })
    router.push(`${pathname}?${params.toString()}`)
  }

  function resetFilters() {
    setFilters(DEFAULTS)
    router.push(pathname)
  }

  const countActiveFilters = (keys: (keyof FilterState)[]): number => {
    return keys.filter(key => filters[key] !== DEFAULTS[key]).length
  }

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = []
    if (filters.searchText) labels.push(`全文: ${filters.searchText}`)
    if (filters.seedValue) labels.push(`Seed: ${filters.seedValue}`)
    if (filters.author) labels.push(`投稿者: ${filters.author}`)
    if (filters.owEase) labels.push(`OW走りやすさ: ${filters.owEase}`)
    if (filters.owTypes.length > 0) labels.push(`OWタイプ: ${filters.owTypes.join(' / ')}`)
    if (filters.villageType) labels.push(`村タイプ: ${filters.villageType}`)
    if (filters.hasBlacksmith) labels.push(`鍛冶屋: ${filters.hasBlacksmith}`)
    if (filters.netherEase) labels.push(`ネザー走りやすさ: ${filters.netherEase}`)
    if (filters.fortressDistance) labels.push(`廃要塞距離: ${filters.fortressDistance}`)
    if (filters.fortressTypes.length > 0) labels.push(`廃要塞タイプ: ${filters.fortressTypes.join(' / ')}`)
    if (filters.fortressToNetherDist) labels.push(`砦とネザー要塞の距離: ${filters.fortressToNetherDist}`)
    if (filters.portalRoomEase) labels.push(`ポータル部屋: ${filters.portalRoomEase}`)
    if (filters.zeroCycle) labels.push(`ゼロサイクル: ${filters.zeroCycle}`)
    return labels
  }, [filters])

  const showVillageFields = filters.owTypes.includes('村')

  const accordionItems = [
    {
      id: 'basic',
      title: '基本条件',
      badge: [filters.searchText, filters.seedValue, filters.author, filters.orderBy !== DEFAULTS.orderBy].filter(Boolean).length,
      defaultOpen: true,
      children: (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">全文検索</label>
            <input
              type="text"
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Seed・タイトル・コメントを検索"
              value={filters.searchText}
              onChange={e => updateField('searchText', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Seed 値</label>
            <input
              type="text"
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="完全一致検索"
              value={filters.seedValue}
              onChange={e => updateField('seedValue', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">投稿者名</label>
            <input
              type="text"
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="ユーザー名で検索"
              value={filters.author}
              onChange={e => updateField('author', e.target.value)}
            />
          </div>
          {/* ソート順とフォロー中のみのチェックは結果欄の右上へ移動しました */}
        </div>
      )
    },
    {
      id: 'overworld',
      title: 'オーバーワールド',
      badge: countActiveFilters(['owEase', 'villageType', 'hasBlacksmith']),
      defaultOpen: false,
      children: (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">走りやすさ</label>
            <select
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
              value={filters.owEase}
              onChange={e => updateField('owEase', e.target.value)}
            >
              <option value="">すべて</option>
              <option value="EASY">走りやすい</option>
              <option value="NORMAL">普通</option>
              <option value="HARD">走りにくい</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">オーバーワールドのタイプ</label>
            <div className="grid grid-cols-2 gap-2">
              {OW_TYPE_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleMultiValue('owTypes', option)}
                  className={`rounded-lg border px-3 py-2 text-sm text-left transition ${isSelected('owTypes', option)
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {showVillageFields && (
            <>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">村のタイプ</label>
                <select
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  value={filters.villageType}
                  onChange={e => updateField('villageType', e.target.value)}
                >
                  <option value="">すべて</option>
                  <option value="平原">平原</option>
                  <option value="砂漠">砂漠</option>
                  <option value="サバンナ">サバンナ</option>
                  <option value="雪原">雪原</option>
                  <option value="タイガ">タイガ</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">鍛冶屋の有無</label>
                <select
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  value={filters.hasBlacksmith}
                  onChange={e => updateField('hasBlacksmith', e.target.value)}
                >
                  <option value="">すべて</option>
                  <option value="true">あり</option>
                  <option value="false">なし</option>
                </select>
              </div>
            </>
          )}
        </div>
      )
    },
    {
      id: 'nether',
      title: 'ネザー',
      badge: countActiveFilters(['netherEase', 'fortressDistance', 'fortressToNetherDist']),
      defaultOpen: false,
      children: (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">走りやすさ</label>
            <select
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
              value={filters.netherEase}
              onChange={e => updateField('netherEase', e.target.value)}
            >
              <option value="">すべて</option>
              <option value="EASY">走りやすい</option>
              <option value="NORMAL">普通</option>
              <option value="HARD">走りにくい</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">廃要塞の距離</label>
            <select
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
              value={filters.fortressDistance}
              onChange={e => updateField('fortressDistance', e.target.value)}
            >
              <option value="">すべて</option>
              <option value="NEAR">近い</option>
              <option value="NORMAL">普通</option>
              <option value="FAR">遠い</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">廃要塞のタイプ</label>
            <div className="grid grid-cols-2 gap-2">
              {FORTRESS_TYPE_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleMultiValue('fortressTypes', option)}
                  className={`rounded-lg border px-3 py-2 text-sm text-left transition ${isSelected('fortressTypes', option)
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">廃要塞とネザー要塞の距離</label>
            <select
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
              value={filters.fortressToNetherDist}
              onChange={e => updateField('fortressToNetherDist', e.target.value)}
            >
              <option value="">すべて</option>
              <option value="NEAR">近い</option>
              <option value="NORMAL">普通</option>
              <option value="FAR">遠い</option>
            </select>
          </div>
        </div>
      )
    },
    {
      id: 'end',
      title: 'エンド',
      badge: countActiveFilters(['portalRoomEase', 'zeroCycle']),
      defaultOpen: false,
      children: (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">ポータル部屋</label>
            <select
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
              value={filters.portalRoomEase}
              onChange={e => updateField('portalRoomEase', e.target.value)}
            >
              <option value="">すべて</option>
              <option value="EASY">見つけやすい</option>
              <option value="HARD">見つけにくい</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">ゼロサイクル</label>
            <select
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
              value={filters.zeroCycle}
              onChange={e => updateField('zeroCycle', e.target.value)}
            >
              <option value="">すべて</option>
              <option value="EASY">簡単</option>
              <option value="HARD">難しい</option>
            </select>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white border shadow-sm p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-lg text-slate-900">検索フィルター</h3>
          <p className="text-sm text-slate-500 mt-1">条件は AND で適用されます。</p>
        </div>

        <Accordion items={accordionItems} />

        <div className="flex gap-3 mt-4">
          <button type="button" className="btn btn-primary flex-1" onClick={applyFilters}>
            条件を適用
          </button>
          <button type="button" className="btn btn-secondary" onClick={resetFilters}>
            リセット
          </button>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="font-semibold text-slate-900">
            検索結果 <span className="text-primary-600">{loading ? '...' : results.length}</span> 件
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.followingOnly === 'true'}
                onChange={e => updateField('followingOnly', e.target.checked ? 'true' : '')}
                className="rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">フォロー中のみ</span>
            </label>

            <select
              className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              value={filters.orderBy}
              onChange={e => updateField('orderBy', e.target.value)}
            >
              <option value="createdAt">新着順</option>
              <option value="updatedAt">古い順</option>
              <option value="likes">いいね数順</option>
              <option value="pb">投稿者PBタイム順</option>
            </select>
          </div>
        </div>

        {activeFilterLabels.length > 0 && (
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-900 mb-2">適用中の条件</div>
            <div className="flex flex-wrap gap-2">
              {activeFilterLabels.map(label => (
                <span key={label} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 border">
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        <div>
          {loading ? (
              <div className="rounded-2xl bg-white border shadow-sm p-4">
                <SeedGridSkeleton count={6} />
              </div>
            ) : results.length > 0 ? (
            <SeedGrid
              seeds={results}
            />
          ) : (
            <div className="rounded-2xl bg-white border shadow-sm p-8 text-center text-slate-500">
              <p>条件に合致するシードがありません</p>
              <p className="text-sm mt-2">条件を減らして検索し直してください</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
