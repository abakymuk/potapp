// Temporary fix for CI - using relative import
import { helloLib } from '../../../packages/lib/src/index'

import { formatMessage } from '@/utils/helpers'

export const webBoot = () => `web-ready with ${helloLib()} and ${formatMessage('test')}`
