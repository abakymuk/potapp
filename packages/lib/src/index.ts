// Temporary fix for CI - using relative import
import { helloContracts } from '../../../packages/contracts/src/index'
export const helloLib = () => `lib-ready with ${helloContracts()}`

// Export feature flags
export { isEnabled } from './ff'
export type { FFContext, FFResult } from './ff/types'
