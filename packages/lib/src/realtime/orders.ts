import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

export type OrderChange = {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  new: any
  old: any
}

export function createSupabaseAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

/**
 * Подписка на заказы конкретного tenant
 */
export function subscribeOrders(tenantId: string, onChange: (c: OrderChange) => void) {
  const supabase = createSupabaseAnon()
  const channelName = `orders:tenant:${tenantId}`

  const ch: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` },
      (payload) =>
        onChange({
          type: payload.eventType as OrderChange['type'],
          new: payload.new,
          old: payload.old,
        }),
    )
    .subscribe((status) => {
      // optional: status handling 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR'
      console.log(`Realtime channel ${channelName}: ${status}`)
    })

  return () => supabase.removeChannel(ch)
}
