import type { Metadata } from 'next'
import { IBM_Plex_Mono } from 'next/font/google'
import '@/styles/globals.css'
import LenisProvider from '@/components/LenisProvider'
import { Agentation } from 'agentation'

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Portfolio — Lab',
  description: 'Design portfolio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={ibmPlexMono.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght,GRAD,ROND@8..144,100..900,0..150,0..100&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LenisProvider>{children}</LenisProvider>
        {process.env.NODE_ENV === 'development' && <Agentation />}
      </body>
    </html>
  )
}
