'use client'
import { useEffect, useState } from 'react'
import { isEnabled } from '@lib/ff' // экспортируй через index.ts пакета

const KEY = 'new_checkout_flow'

function getDistinctId(): string {
  const k = '__demo_distinct_id'
  let id = localStorage.getItem(k)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(k, id)
  }
  return id
}

export default function Client() {
  const [state, setState] = useState<{
    loading: boolean
    enabled: boolean
    variant?: string | null
    source?: string
  }>({ loading: true, enabled: false })
  useEffect(() => {
    const did = getDistinctId()
    isEnabled({ kind: 'web', distinctId: did }, KEY).then((r) =>
      setState({ loading: false, enabled: r.enabled, variant: r.variant, source: r.source }),
    )
  }, [])
  if (state.loading) return <div className="p-6 text-sm opacity-70">Checking feature flag…</div>
  return (
    <div className="p-6 space-y-4">
      <div className="text-xs opacity-70">
        flag: <b>{KEY}</b> | source: {state.source} | variant: {state.variant ?? '—'}
      </div>
      {state.enabled ? (
        <div className="rounded-xl border p-6">
          ✅ <b>New Checkout</b> is ENABLED — показываем новый поток
        </div>
      ) : (
        <div className="rounded-xl border p-6">⬜ Old Checkout — флаг выключен</div>
      )}
      <button className="rounded-lg border px-3 py-1 text-sm" onClick={() => location.reload()}>
        Refetch
      </button>
    </div>
  )
}
