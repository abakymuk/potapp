import { processEvent } from '@/utils/processor'

// Temporary fix for CI - using relative import
import type { CloudEvent } from '../../../packages/contracts/src/index'

export const consume = (e: CloudEvent) => `worker-ready for ${e.type} - ${processEvent(e.type)}`
