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
  return (
    <DevseedUiThemeProvider theme={theme}>
      <Page>
        <PageBody>
          <PageMainContent>
            <Header>
              <h1>Meet-n-Greta: gather sustainably</h1>
              <Button
                disabled
                fitting="regular"
                radius="rounded"
                size="medium"
                variation="primary-fill"
              >
                Add your team (soon)
              </Button>
            </Header>
            <Planner baseTeam={DEFAULT_TEAM} />
          </PageMainContent>
        </PageBody>
      </Page>
    </DevseedUiThemeProvider>
  )
}
