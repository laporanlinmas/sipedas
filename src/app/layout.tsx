import type { Metadata, Viewport } from 'next'

import '@/styles/base.css'
import '@/styles/header.css'
import '@/styles/form.css'
import '@/styles/upload.css'
import '@/styles/submit.css'
import '@/styles/modals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'SI-PEDAS — Sistem Informasi Pedestrian Satlinmas',
  description: 'Sistem Informasi Pedestrian Satlinmas',
  icons: {
    icon: [
      { url: '/assets/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' }
    ],
    apple: '/assets/icon-192.png',
    shortcut: '/assets/icon-32.png'
  },
  appleWebApp: {
    capable: true,
    title: 'SI-PEDAS',
    statusBarStyle: 'black-translucent'
  },
  other: {
    'mobile-web-app-capable': 'yes',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet" />
      </head>
      <body>
        <div className="bg-glow"></div>
        {children}
      </body>
    </html>
  )
}
