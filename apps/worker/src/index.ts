import type { CloudEvent } from '@potlucky/contracts'

import { processEvent } from '@/utils/processor'

export const consume = (e: CloudEvent) => `worker-ready for ${e.type} - ${processEvent(e.type)}`
