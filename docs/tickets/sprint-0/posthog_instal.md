Integrate PostHog with Next.js
Read the docs
Client-side installation
Automated Installation
BETA
AI setup wizard
Try using the AI setup wizard to automatically install PostHog.

Run the following command from the root of your Next.js project.

npx -y @posthog/wizard@latest --eu
OR
Manual Installation
Install posthog-js using your package manager
npm install posthog-js
# OR
yarn add posthog-js
# OR
pnpm add posthog-js
Add environment variables
Add your environment variables to your .env.local file and to your hosting provider (e.g. Vercel, Netlify, AWS). You can find your project API key in your project settings.

These values need to start with NEXT_PUBLIC_ to be accessible on the client-side.

NEXT_PUBLIC_POSTHOG_KEY=phc_fg3D6jOSQxCrYRLoxoZx2X11FwgKoL5b0RSnJfdEnnV
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
Initialize
Next.js 15.3+
App router
Pages router
If you're using Next.js 15.3+ you can use instrumentation-client.ts|js for a light-weight, fast integration

// app/providers.tsx
'use client'

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { usePostHog } from 'posthog-js/react'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
      person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
      defaults: '2025-05-24'
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  )
}

// instrumentation-client.js
import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: '2025-05-24'
});
            
Capturing component render errors
Next.js uses error boundaries to handle uncaught exceptions by rendering a fallback UI instead of the crashing components.

To set one up, create a error.jsx file in any of your route directories. This triggers when there is an error rendering your component and should look like this:

// error.jsx

"use client";  // Error boundaries must be Client Components

import posthog from "posthog-js";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}) {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return (
    ...
  );
}
You can also create a Global Error component in your root layout to capture unhandled exceptions in your root layout.

// app/global-error.jsx

'use client' // Error boundaries must be Client Components

import posthog from "posthog-js";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}) {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return (
    // global-error must include html and body tags
    <html>
      <body>
        {/* `NextError` is the default Next.js error page component */}
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
Optional: Capture exceptions manually
If you'd like, you can manually capture exceptions that you handle in your application.

posthog.captureException(error, additionalProperties)
Server-side installation
Next.js enables you to capture exceptions on both server-side render pages and within server-side functionality. To integrate PostHog into your Next.js app on the server-side, you can use the Node SDK.

Install posthog-node using your package manager
npm install posthog-node
# OR
yarn add posthog-node
# OR
pnpm add posthog-node
Create a reusable client
// app/posthog-server.js

import { PostHog } from 'posthog-node'

let posthogInstance = null

export function getPostHogServer() {
  if (!posthogInstance) {
    posthogInstance = new PostHog(
      'phc_fg3D6jOSQxCrYRLoxoZx2X11FwgKoL5b0RSnJfdEnnV',
      {
        host: 'https://eu.i.posthog.com',
        flushAt: 1,
        flushInterval: 0 // Because server-side functions in Next.js can be short-lived we flush regularly
      }
    )
  }
  return posthogInstance
}
Capturing server errors
To capture errors that occur in your server-side code, you can set up a instrumentation.js file at the root of your project. This provides a onRequestError hook that you can use to capture errors.

You can check the runtime to ensure PostHog works and fetch the distinct_id from the cookie to connect the error to a specific user

// instrumentation.js

export function register() {
  // No-op for initialization
}

export const onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getPostHogServer } = require('./app/posthog-server')
    const posthog = await getPostHogServer()

    let distinctId = null
    if (request.headers.cookie) {
      const cookieString = request.headers.cookie
      const postHogCookieMatch = cookieString.match(/ph_phc_.*?_posthog=([^;]+)/)

      if (postHogCookieMatch && postHogCookieMatch[1]) {
        try {
          const decodedCookie = decodeURIComponent(postHogCookieMatch[1])
          const postHogData = JSON.parse(decodedCookie)
          distinctId = postHogData.distinct_id
        } catch (e) {
          console.error('Error parsing PostHog cookie:', e)
        }
      }
    }

    await posthog.captureException(err, distinctId || undefined)
  }
}