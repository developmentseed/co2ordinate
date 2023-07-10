import styled from 'styled-components'
import { Drop } from './Drop'

const AddTeamOptions = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0;
  & > li {
    margin-bottom: 0.5rem;
    font-w
  }

  & > li:not(:last-child):after {
    display: block;
    width: 100%;
    text-align: center;
    border-bottom: 1px solid #ccc;
    height: 12px;
    content: 'or';
  }

  & > li > input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  & em {
    display: block;
  }
`

export default function AddTeam() {
  return (
    <>
      <h2>1. Add team members</h2>
      <AddTeamOptions>
        <li>✛ Click on the map to set participant locations</li>
        <li>
          <input
            disabled
            placeholder="Search locations to set points (SOON)"
          ></input>
        </li>
        <li>
          Add CSV file
          <em>Must include name, lat, lon columns. Optional 'group' column.</em>
          <Drop />
        </li>
      </AddTeamOptions>
    </>
  )
}
