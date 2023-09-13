import { Planner } from './components/Planner'
import DEFAULT_TEAM from './exampleTeam'
import { DevseedUiThemeProvider, themeVal } from '@devseed-ui/theme-provider'
import theme from './theme'
import styled from 'styled-components'

const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-height: 100vh;
  margin: 0 auto;
`

const PageHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
  position: sticky;
  top: 0;
  z-index: 999;
  background: white;
  padding: 0.3rem 1rem;
  border: 2px solid black;
  h1 {
    font-size: 1.25rem;
    text-transform: uppercase;
    line-height: 1.125;
    letter-spacing: 1px;
  }
  p {
    line-height: 1;
    font-size: 0.75rem;
  }
`

const PageMainContent = styled.main`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`

const PlannerWrapper = styled.div`
  position: relative;
  height: calc(100vh - 50px);
`

export function App() {
  return (
    <DevseedUiThemeProvider theme={theme}>
      <Page>
        <PageMainContent>
          <PageHeader>
            <div>
              <h1>Co₂ordinate</h1>
              <p>gather sustainably</p>
            </div>
          </PageHeader>
          <PlannerWrapper>
            <Planner baseTeam={DEFAULT_TEAM} />
          </PlannerWrapper>
        </PageMainContent>
      </Page>
    </DevseedUiThemeProvider>
  )
}
