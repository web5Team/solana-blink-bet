import type { Metadata } from 'next'
import AppProviders from './components/providers'
import { Registry } from './registry'

import './globals.scss'
import './custom.scss'
import '@fontsource-variable/roboto-flex'
import '@fontsource-variable/jetbrains-mono'
import { Toaster } from './components/ui/toaster'

const APP_NAME = 'TEMPLATE_APP_NAME'
const APP_DESCRIPTION = 'TEMPLATE_APP_DESCRIPTION'

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: '%s - NJS App',
  },
  description: APP_DESCRIPTION,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    shortcut: '/favicon.png',
    apple: [{ url: '/favicon.png', sizes: '180x180' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      suppressHydrationWarning
      dir="ltr"
      lang="zh"
    >
      <body>
        <Registry>
          <AppProviders>{children}</AppProviders>
        </Registry>

        <Toaster />
      </body>
    </html>
  )
}
