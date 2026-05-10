import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, Google_Sans_Flex } from 'next/font/google'
import '@/styles/globals.css'
import RootShell from '@/components/RootShell'

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-mono',
  display: 'swap',
})

const googleSansFlex = Google_Sans_Flex({
  subsets: ['latin'],
  weight: 'variable',
  axes: ['GRAD', 'ROND', 'opsz'],
  variable: '--font-brand-google',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Portfolio — Lab',
  description: 'Design portfolio',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${ibmPlexMono.variable} ${googleSansFlex.variable}`}>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
      </head>
      <body>
        <RootShell>{children}</RootShell>
      </body>
    </html>
  )
}
