import React from "react"
import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'

import './globals.css'

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StyleMirror | Virtual Try-On Experience',
  description: 'Discover your perfect look with our AI-powered virtual try-on kiosk',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FAFAFA',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased overflow-hidden">{children}</body>
    </html>
  )
}
