import { Planner } from './Planner'
import DEFAULT_TEAM from './exampleTeam'

export function App() {
  return (
    <>
      <h1>Meet-n-Greta</h1>
      <h2>Gather sustainably</h2>
      <Planner team={DEFAULT_TEAM}/>
    </>
  )
}
