'use client'

import { usePostHog } from 'posthog-js/react'
import React, { useEffect } from 'react'

export default function HomePage() {
  const posthog = usePostHog()

  useEffect(() => {
    // Захватываем событие посещения страницы
    posthog?.capture('page_viewed', {
      page: 'home',
      timestamp: new Date().toISOString(),
    })
  }, [posthog])

  const handleButtonClick = () => {
    posthog?.capture('button_clicked', {
      button_name: 'demo_button',
      page: 'home',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          PotLucky - PostHog Integration Demo
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">PostHog Analytics</h2>
          <p className="text-gray-600 mb-4">
            Эта страница демонстрирует интеграцию PostHog для аналитики и отслеживания событий.
          </p>

          <button
            onClick={handleButtonClick}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Отправить событие в PostHog
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Feature Flags</h2>
          <p className="text-gray-600 mb-4">
            Проверьте работу Feature Flags на специальной странице.
          </p>

          <a
            href="/ff-demo"
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Перейти к Feature Flags Demo
          </a>
        </div>
      </div>
    </div>
  )
}
