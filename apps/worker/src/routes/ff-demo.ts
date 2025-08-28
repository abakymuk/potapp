// Temporary implementation for demo
export default async function ffDemo(req: Request, env: Record<string, string>): Promise<Response> {
  const url = new URL(req.url)
  const key = url.searchParams.get('key') || 'new_checkout_flow'
  const distinctId = url.searchParams.get('distinct_id') || 'anon-worker'
  
  // Mock response for now
  const res = { 
    key, 
    enabled: false, 
    variant: null, 
    source: 'fallback' as const 
  }
  
  return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } })
}
