import countryCodeEmoji from 'country-code-emoji'
import styled from 'styled-components'
import {
  currentResultAtom,
  resultsAtom,
  selectedAirportCodeAtom,
} from './atoms.ts'
import { useAtom, useAtomValue } from 'jotai'
import { SCORES_RAMP, THEME_COLOR } from '../constants'
import { formatCO2, getScores } from '../lib/getOnsiteLocations'
import useEquivalent from '../hooks/useEquivalent'
import { Table } from './Planner'

const CandidatesTableSection = styled.div`
  flex: 1;
`

const ResultRow = styled.tr`
  cursor: pointer;
  background: ${({ selected }) => (selected ? THEME_COLOR : 'transparent')};
  color: ${({ selected }) => (selected ? 'white' : 'inherit')};
  :hover {
    background: #ddd;
  }
`

const Equivalent = styled.p`
  margin: 0.5rem 0 1rem;
`

const Footer = styled.div`
  margin-top: 2rem;
`

const ScorePill = styled.span`
  background: ${({ color }) => color};
  color: black;
  padding: 0.1rem 0.5rem;
  border-radius: 99rem;
`

const HomeIcon = styled.img`
  float: left;
  margin-right: 0.2rem;
`

export function Candidates() {
  const results = useAtomValue(resultsAtom)
  const currentResult = useAtomValue(currentResultAtom)
  const [selectedAirportCode, setSelectedAirportCode] = useAtom(
    selectedAirportCodeAtom
  )
  const equivalent = useEquivalent(currentResult)

  return (
    <>
      {!!results?.length && (
        <>
          <CandidatesTableSection>
            {currentResult && (
              <h2>
                Travelling to {currentResult.properties.municipality}:{' '}
                {currentResult.properties.airportTeamMembers.length} people -{' '}
                <ScorePill color={SCORES_RAMP[currentResult.properties.score]}>
                  {formatCO2(currentResult.properties.totalCO2)}
                </ScorePill>
              </h2>
            )}
            {equivalent && (
              <Equivalent>
                {equivalent[0]} (<a href={equivalent[1]}>source</a>)
              </Equivalent>
            )}{' '}
            <Table>
              <tbody>
                <tr>
                  <th>Name/IATA code</th>
                  <th>Country</th>
                  <th>Total CO₂</th>
                  <th>Total dist</th>
                  <th>Home?</th>
                </tr>
                {results?.map((result) => (
                  <ResultRow
                    key={result.properties.iata_code}
                    onClick={
                      () => setSelectedAirportCode(result.properties.iata_code)
                      /* eslint-disable-next-line */
                    }
                    selected={
                      result.properties.iata_code === selectedAirportCode
                    }
                  >
                    <td>
                      {result.properties.municipality} (
                      {result.properties.iata_code})
                    </td>
                    <td>
                      {result.properties.iso_country}{' '}
                      {countryCodeEmoji(result.properties.iso_country)}{' '}
                    </td>
                    <td>
                      <ScorePill color={SCORES_RAMP[result.properties.score]}>
                        {formatCO2(result.properties.totalCO2)}
                      </ScorePill>
                    </td>
                    <td>{Math.round(result.properties.totalKm)} km</td>
                    <td>
                      {[...Array(result.properties.homeAirportCount)].map(
                        (e, i) => (
                          <HomeIcon src="./house.png" />
                        )
                      )}
                      {/* {result.properties.homeAirportCount
                        ? '🏡'.repeat(result.properties.homeAirportCount)
                        : ''} */}
                    </td>
                  </ResultRow>
                ))}
              </tbody>
            </Table>
          </CandidatesTableSection>
          <Footer>
            ⚠️ Those numbers are estimates based on kg CO₂/km averages, which
            may be less accurate than the industry-standard based on other
            factors such as payload, carrier type, layovers, etc.
            <br />
            <a href="https://github.com/developmentseed/meet-and-greta">
              Discuss this prototype on the Github repo
            </a>
          </Footer>
        </>
      )}
    </>
  )
}
