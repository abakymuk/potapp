'use client' // Error boundaries must be Client Components

import posthog from 'posthog-js'
import React, { useEffect } from 'react'

export default function GlobalError({
  error,
  _reset,
}: {
  error: Error & { digest?: string }
  _reset: () => void
}) {
  useEffect(() => {
    posthog.captureException(error)
  }, [error])

  return (
    // global-error must include html and body tags
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-4">Что-то пошло не так!</h2>
          <p className="text-gray-600 mb-4">Произошла критическая ошибка</p>
        </div>
      </body>
    </html>
  )
}
