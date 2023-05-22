import { Planner } from './planner/Planner'
import DEFAULT_TEAM from './exampleTeam'
import {
  DevseedUiThemeProvider,
  themeVal,
  glsp,
  media,
  divide,
} from '@devseed-ui/theme-provider'
import theme from './theme'
import styled, { css } from 'styled-components'
import { Button } from '@devseed-ui/button'
import { useDropzone } from 'react-dropzone'
import { useCallback, useState } from 'react'
import { parse } from 'papaparse'
import { TeamMember } from './planner/getOnsiteLocations'

const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: ${themeVal('layout.max')};
  margin: 0 auto;
`

const PageBody = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`

const innerSpacingCss = (size) => css`
  gap: ${glsp(themeVal(`layout.gap.${size}`))};
  padding: ${glsp(
    divide(themeVal(`layout.gap.${size}`), 2),
    themeVal(`layout.gap.${size}`)
  )};
`

const Header = styled.header`
  display: flex;
  justify-content: space-between;
`

export const PageMainContent = styled.main`
  ${innerSpacingCss('xsmall')}
  flex-grow: 1;
  display: flex;
  flex-direction: column;

  ${media.smallUp`
    ${innerSpacingCss('xsmall')}
  `}

  ${media.mediumUp`
    ${innerSpacingCss('medium')}
  `}

  ${media.largeUp`
    ${innerSpacingCss('large')}
  `}

  ${media.xlargeUp`
    ${innerSpacingCss('xlarge')}
  `}
`

export function App() {
  const [customTeam, setCustomTeam] = useState<TeamMember[] | null>(null)
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader()

      reader.onabort = () => console.log('file reading was aborted')
      reader.onerror = () => console.log('file reading has failed')
      reader.onload = () => {
        const rawText = reader.result
        const { data } = parse(rawText, { header: true })
        const features = data.map(({ lat, lon, name }) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lon, lat],
          },
          properties: {
            name,
          },
        }))
        setCustomTeam(features)
      }
      reader.readAsText(file)
    })
  }, [])
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
  })
  return (
    <DevseedUiThemeProvider theme={theme}>
      <Page>
        <PageBody>
          <PageMainContent>
            <Header>
              <h1>Meet-n-Greta: gather sustainably</h1>
              <Button
                {...getRootProps({ className: 'dropzone' })}
                fitting="regular"
                radius="rounded"
                size="medium"
                variation="primary-fill"
              >
                Upload CSV (lat,lon, name)
                <input {...getInputProps()} />
              </Button>
            </Header>
            <Planner baseTeam={customTeam || DEFAULT_TEAM} />
          </PageMainContent>
        </PageBody>
      </Page>
    </DevseedUiThemeProvider>
  )
}
