"use client";  // Error boundaries must be Client Components

import posthog from "posthog-js";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">Что-то пошло не так!</h2>
      <button
        className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        onClick={() => reset()}
      >
        Попробовать снова
      </button>
    </div>
  );
}
