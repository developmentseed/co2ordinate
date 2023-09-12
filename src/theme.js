import { createUITheme } from '@devseed-ui/theme-provider'

export default function themeOverrides() {
  const fontFamily = '"IBM Plex Mono", Courier New, monospace'

  return createUITheme({
    type: {
      base: {
        family: fontFamily,
        weight: 'normal',
      },
      heading: {
        family: fontFamily,
        settings: '"wdth" 24, "wght" 640',
        weight: 'normal',
      },
    },
    button: {
      shape : {rounded: 0},
      type: {
        family: fontFamily,
        settings: '"wdth" 32, "wght" 592',
        weight: 'normal',
        case: 'uppercase',
      },
    },
    layout: {
      max: '1920px',
      // The gap is defined as a multiplier of the layout.space The elements
      // that use the gap should use it as a parameter for the glsp function
      gap: {
        xsmall: 1,
        small: 1,
        medium: 2,
        large: 2,
        xlarge: 2,
      },
    },
  })
}
