import { Planner } from './components/Planner'
import DEFAULT_TEAM from './exampleTeam'
import { DevseedUiThemeProvider, themeVal } from '@devseed-ui/theme-provider'
import theme from './theme'
import styled from 'styled-components'

const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: ${themeVal('layout.max')};
  margin: 0 auto;
  font-size: 0.9rem;
`

const PageBody = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  height: 50px;
  position: sticky;
  top: 0;
  z-index: 999;
  background: white;
  padding: 0.3rem 1rem;

  h1 {
    font-size: 1.4rem;
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
        <PageBody>
          <PageMainContent>
            <Header>
              <h1>Meet-n-Greta: gather sustainably</h1>
            </Header>
            <PlannerWrapper>
              <Planner baseTeam={DEFAULT_TEAM} />
            </PlannerWrapper>
          </PageMainContent>
        </PageBody>
      </Page>
    </DevseedUiThemeProvider>
  )
}
