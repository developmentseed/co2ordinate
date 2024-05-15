import { createUITheme } from '@devseed-ui/theme-provider'

export default function themeOverrides() {
  const fontFamily = '"Roboto Mono", Courier New, monospace'

  return createUITheme({
    type: {
      base: {
        family: fontFamily,
        weight: 'normal',
        color: '#000000',
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
        weight: 'bold',
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
