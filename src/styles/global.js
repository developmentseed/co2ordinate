import { createGlobalStyle, css } from 'styled-components'
import { glsp, themeVal } from '@devseed-ui/theme-provider'

const customStyles = css`
  .mapboxgl-map,
  .mapboxgl-popup-content {
    font-size: 0.75rem;
    font-family: ${themeVal('type.base.family')};
    color: ${themeVal('type.base.color')};
  }
  .mapboxgl-popup-content {
    font-size: 0.75rem;
    line-height: 1rem;
    border-radius: 0;
    border: 1px solid #1A1A1A;
    & > div {
      display: flex;
      flex-flow: column nowrap;
      gap: 0.25rem;
      button,
      input {
        border-radius: 0;
        box-shadow: none;
        outline: none;
        border: 1px solid #1A1A1A;
        font-weight: bold;
      }
      h1 {
        font-size: 1rem;
        text-transform: uppercase;
      }
    }
  }
  .mapboxgl-popup-close-button {
    border-radius: 0;
    font-size: 1.125rem;
    top: 0.25rem;
    right: 0.25rem;
  }
`

const GlobalStyles = createGlobalStyle`
  ${customStyles}
`

export default GlobalStyles
