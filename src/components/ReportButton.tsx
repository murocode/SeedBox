"use client"

import { useState } from 'react'
import SupportModal from './SupportModal'

type Props =
  | { targetType: 'seed'; targetSeedId: number; targetSeedValue?: string; targetAuthorUsername?: string }
  | { targetType: 'user'; targetUsername: string }

export default function ReportButton(props: Props) {
  const [open, setOpen] = useState(false)

  const target =
    props.targetType === 'seed'
      ? {
          type: 'seed' as const,
          seedId: props.targetSeedId,
          seedValue: props.targetSeedValue ?? String(props.targetSeedId),
          authorUsername: props.targetAuthorUsername ?? ''
        }
      : {
          type: 'user' as const,
          username: props.targetUsername
        }

  function openModal(e: React.MouseEvent) {
    e.stopPropagation()
    setOpen(true)
  }

  return (
    <>
      <button className="btn btn-secondary disabled:opacity-60" onClick={openModal}>
        <i className="fa-solid fa-flag mr-2" aria-hidden />通報
      </button>

      <SupportModal open={open} initialCategory="REPORT" target={target} onClose={() => setOpen(false)} lockCategory />
    </>
  )
}
