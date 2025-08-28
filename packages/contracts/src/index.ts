export type CloudEvent<T = unknown> = {
  id: string
  source: string
  type: string
  subject?: string
  time: string // ISO
  data: T
}

export const helloContracts = () => 'contracts-ready'
