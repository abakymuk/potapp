export type FFContext =
  | {
      kind: 'web'
      distinctId: string
      personProps?: Record<string, unknown>
      groups?: Record<string, string>
    }
  | {
      kind: 'worker'
      distinctId: string
      personProps?: Record<string, unknown>
      groups?: Record<string, string>
      host?: string
      apiKey?: string
    }

export type FFResult = {
  key: string
  enabled: boolean
  variant?: string | null
  source: 'cache' | 'posthog' | 'client' | 'fallback'
}
