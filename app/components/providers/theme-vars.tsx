'use client'
import { type DefaultTheme, ThemeProvider } from 'styled-components'

export function ThemeVarsProvider({ children }: { children: React.ReactNode }) {
  const themeVars = {
    colors: {
      background: 'var(--background)',
      foreground: 'var(--foreground)',
      card: 'var(--card)',
      cardForeground: 'var(--card-foreground)',
      popover: 'var(--popover)',
      popoverForeground: 'var(--popover-foreground)',
      primary: 'var(--primary)',
      primaryForeground: 'var(--primary-foreground)',
      secondary: 'var(--secondary)',
      secondaryForeground: 'var(--secondary-foreground)',
      muted: 'var(--muted)',
      mutedForeground: 'var(--muted-foreground)',
      accent: 'var(--accent)',
      accentForeground: 'var(--accent-foreground)',
      destructive: 'var(--destructive)',
      destructiveForeground: 'var(--destructive-foreground)',
      border: 'var(--border)',
      input: 'var(--input)',
      ring: 'var(--ring)',
      radius: 'var(--radius)',
      chart1: 'var(--chart-1)',
      chart2: 'var(--chart-2)',
      chart3: 'var(--chart-3)',
      chart4: 'var(--chart-4)',
      chart5: 'var(--chart-5)',
    },
  } satisfies DefaultTheme

  return (
    <ThemeProvider
      theme={themeVars}
    >
      {children}
    </ThemeProvider>
  )
}
