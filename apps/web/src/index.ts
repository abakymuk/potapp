import { helloLib } from '@potlucky/lib'

import { formatMessage } from '@/utils/helpers'

export const webBoot = () => `web-ready with ${helloLib()} and ${formatMessage('test')}`
