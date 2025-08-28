import { formatMessage } from '@/utils/helpers'

// Temporary fix for CI - using relative import
import { helloLib } from '../../../packages/lib/src/index'

export const webBoot = () => `web-ready with ${helloLib()} and ${formatMessage('test')}`
