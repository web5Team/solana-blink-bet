import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import { useMemo } from 'react'

const themes = ['light', 'dark'] as const

export function DarkThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      disableTransitionOnChange
      enableSystem
      attribute="class"
      defaultTheme="system"
      themes={Array.from(themes)}
    >
      {children}
    </NextThemesProvider>
  )
}

export function useDarkTheme() {
  const { resolvedTheme, setTheme } = useTheme()
  return {
    theme: useMemo(() => resolvedTheme as (typeof themes[number] | undefined), [resolvedTheme]),
    setDarkTheme: (value: boolean) => setTheme(value ? 'dark' : 'light'),
  }
}
