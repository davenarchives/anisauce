import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AniSauce',
    short_name: 'AniSauce',
    description: 'anime source finder',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/icon.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  }
}
