// import original module declarations
import 'styled-components'

// and extend them!
declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      background: string
      foreground: string
      card: string
      cardForeground: string
      popover: string
      popoverForeground: string
      primary: string
      primaryForeground: string
      secondary: string
      secondaryForeground: string
      muted: string
      mutedForeground: string
      accent: string
      accentForeground: string
      destructive: string
      destructiveForeground: string
      border: string
      input: string
      ring: string
      radius: string
      chart1: string
      chart2: string
      chart3: string
      chart4: string
      chart5: string
    }
  }
}
