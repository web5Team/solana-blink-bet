import type { PropsWithChildren } from 'react'
import AppTanstackProvider from './tanstack'
import { DarkThemeProvider } from './dark-theme'
import { ThemeVarsProvider } from './theme-vars'
import { AuthSessionProvider } from './session'

export default function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthSessionProvider>
      <AppTanstackProvider>
        <DarkThemeProvider>
          <ThemeVarsProvider>
            {children}
          </ThemeVarsProvider>
        </DarkThemeProvider>
      </AppTanstackProvider>
    </AuthSessionProvider>
  )
}
