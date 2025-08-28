import { PostHog } from 'posthog-node'

let posthogInstance = null

export function getPostHogServer() {
  if (!posthogInstance) {
    posthogInstance = new PostHog('phc_fg3D6jOSQxCrYRLoxoZx2X11FwgKoL5b0RSnJfdEnnV', {
      host: 'https://eu.i.posthog.com',
      flushAt: 1,
      flushInterval: 0, // Because server-side functions in Next.js can be short-lived we flush regularly
    })
  }
  return posthogInstance
}
