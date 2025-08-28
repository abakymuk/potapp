'use client'
import React, { useEffect, useState } from 'react'

// Temporary relative import for CI compatibility
import { subscribeOrders, type OrderChange } from '../../../packages/lib/src/realtime/orders'

export default function Page() {
  const [events, setEvents] = useState<OrderChange[]>([])
  const [tenantId, setTenantId] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    if (!tenantId) return

    setIsSubscribed(true)
    const unsubscribe = subscribeOrders(tenantId, (change) => {
      setEvents((prev) => [change, ...prev].slice(0, 20))
    })

    return () => {
      unsubscribe()
      setIsSubscribed(false)
    }
  }, [tenantId])

  const handleTenantChange = (e: React.ChangeEvent<HTMLInputElement> | any) => {
    const newTenantId = e.target.value
    setTenantId(newTenantId)
    localStorage.setItem('__demo_tenant', newTenantId)
  }

  // Загружаем tenant_id из localStorage при монтировании
  useEffect(() => {
    const savedTenantId = localStorage.getItem('__demo_tenant')
    if (savedTenantId) {
      setTenantId(savedTenantId)
    }
  }, [])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Realtime Orders Demo</h1>

      <div className="space-y-2">
        <label htmlFor="tenant-id" className="block text-sm font-medium">
          Tenant ID:
        </label>
        <input
          id="tenant-id"
          className="border rounded px-3 py-2 text-sm w-full max-w-md"
          placeholder="Enter tenant UUID (e.g., 671d5ced-eb31-4f63-8c64-5590f1db78a1)"
          value={tenantId}
          onChange={handleTenantChange}
        />
        <p className="text-xs text-gray-600">
          Status: {isSubscribed ? '🟢 Subscribed' : '🔴 Not subscribed'}
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Realtime Events ({events.length})</h2>
        <div className="text-xs text-gray-600">
          Channel: {tenantId ? `orders:tenant:${tenantId}` : '—'}
        </div>
        <pre className="text-xs overflow-auto max-h-[60vh] border rounded p-4 bg-gray-900 text-green-400">
          {events.length === 0 ? (
            <span className="text-gray-400">
              No events yet. Create an order to see realtime updates.
            </span>
          ) : (
            JSON.stringify(events, null, 2)
          )}
        </pre>
      </div>

      <div className="space-y-2">
        <h3 className="text-md font-semibold">How to test:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Enter your tenant ID above (from seed script output)</li>
          <li>Create a new order via SQL or seed script</li>
          <li>Watch for INSERT events in real-time</li>
          <li>Try different tenant IDs to test isolation</li>
        </ol>
      </div>

      <div className="text-xs text-gray-500">
        <p>
          💡 Tip: Use the tenant ID from your seed script:{' '}
          <code>671d5ced-eb31-4f63-8c64-5590f1db78a1</code>
        </p>
      </div>
    </div>
  )
}
