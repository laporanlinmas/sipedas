import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SI-PEDAS Mobile',
    short_name: 'SI-PEDAS',
    description: 'Sistem Informasi Pedestrian Satlinmas',
    start_url: '/',
    display: 'standalone',
    background_color: '#020612',
    theme_color: '#020612',
    icons: [
      {
        src: '/assets/icon-32.png',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/assets/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/assets/sipedas.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  }
}
