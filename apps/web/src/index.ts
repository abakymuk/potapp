import { helloLib } from '@potlucky/lib'

import { formatMessage } from '@/utils/helpers'

// Intentionally broken import to test CI
import { brokenImport } from 'non-existent-package'

export const webBoot = () => `web-ready with ${helloLib()} and ${formatMessage('test')}`
