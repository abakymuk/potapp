// Temporary fix for CI - using relative import
import type { CloudEvent } from '../../../packages/contracts/src/index'

import { processEvent } from '@/utils/processor'

export const consume = (e: CloudEvent) => `worker-ready for ${e.type} - ${processEvent(e.type)}`
