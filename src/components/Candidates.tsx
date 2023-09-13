import { useState } from 'react'
import countryCodeEmoji from 'country-code-emoji'
import styled from 'styled-components'
import {
  currentResultAtom,
  resultsAtom,
  selectedAirportCodeAtom,
} from './atoms'
import { useAtom, useAtomValue } from 'jotai'
import { SCORES_RAMP } from '../constants'
import { DEFAULT_SCORE_BREAKS, formatCO2 } from '../lib/getOnsiteLocations'
import useEquivalent from '../hooks/useEquivalent'
import Table, { StackedTd } from './Table'
import { Button } from '@devseed-ui/button'
import { CollecticonHouse } from '@devseed-ui/collecticons'

const CurrentResult = styled.article`
  & > div:first-child {
    font-size: 1rem;
    font-weight: bold;
  }
`

const CandidatesTableSection = styled.div`
  flex: 1;
`

const ResultRow = styled.tr`
  cursor: pointer;
  background: ${({ selected }) => (selected ? '#999' : 'transparent')};
  color: ${({ selected }) => (selected ? 'white' : 'inherit')};
  :hover {
    background: #ddd;
  }
`

const Equivalent = styled.p`
  margin: 0.5rem 0;
`

const Footer = styled.div`
  margin-top: auto;
  font-size: 0.75rem;
  line-height: 1.125;
`

const ScorePill = styled.span`
  background: ${({ color }) => color};
  color: 'black';
  padding: 0.1rem 0.5rem;
  border-radius: 99rem;
  line-height: 1.25;
  white-space: pre;
`

const Warning = styled.div`
  background: ${({ color }) => color};
  padding: 0 0.25rem;
  color: white;
  font-weight: bold;
  white-space: initial;
  & a {
    color: white !important;
    text-decoration: underline !important;
  }
`

export function Candidates() {
  const [expanded, setExpanded] = useState(false)
  const results = useAtomValue(resultsAtom)
  const currentResult = useAtomValue(currentResultAtom)
  const [selectedAirportCode, setSelectedAirportCode] = useAtom(
    selectedAirportCodeAtom
  )
  const equivalent = useEquivalent(currentResult)

  const showWarning =
    currentResult?.properties.totalCO2 > DEFAULT_SCORE_BREAKS[0].maxAbsoluteCO2
  const resultsDisplay = expanded ? results : results?.slice(0, 5)

  return (
    <>
      {!!results?.length && (
        <CandidatesTableSection>
          {currentResult && (
            <CurrentResult>
              <div>
                Travelling to {currentResult.properties.municipality}:{' '}
                {currentResult.properties.airportTeamMembers.length} people{' '}
                <ScorePill color={SCORES_RAMP[currentResult.properties.score]}>
                  {formatCO2(currentResult.properties.totalCO2)}
                </ScorePill>
              </div>
              {equivalent && (
                <Equivalent>
                  {equivalent[0]} (<a href={equivalent[1]}>source</a>)
                </Equivalent>
              )}{' '}
              {showWarning && (
                <Warning color={SCORES_RAMP[currentResult.properties.score]}>
                  Warning: this is a high-emission trip.{' '}
                  <a href="https://hbr.org/2022/07/how-to-lead-better-virtual-meetings">
                    Virtual meetings don't have to be bad.
                  </a>{' '}
                  Have you (re)considered this?
                </Warning>
              )}
            </CurrentResult>
          )}

          <Table>
            <tbody>
              <tr>
                <th>Location</th>
                <th>Total CO₂</th>
                <th>Total dist</th>
                <th>Home?</th>
              </tr>
              {resultsDisplay?.map((result) => (
                <ResultRow
                  key={result.properties.iata_code}
                  onClick={
                    () => setSelectedAirportCode(result.properties.iata_code)
                    /* eslint-disable-next-line */
                  }
                  selected={result.properties.iata_code === selectedAirportCode}
                >
                  <StackedTd>
                    {result.properties.municipality} | (
                    {result.properties.iata_code})
                    <span>
                      {result.properties.iso_country}{' '}
                      {countryCodeEmoji(result.properties.iso_country)}{' '}
                    </span>
                  </StackedTd>
                  <td>
                    <ScorePill color={SCORES_RAMP[result.properties.score]}>
                      {formatCO2(result.properties.totalCO2)}
                    </ScorePill>
                  </td>
                  <td>{Math.round(result.properties.totalKm)} km</td>
                  <td>
                    {[...Array(result.properties.homeAirportCount)].map(
                      (e, i) => (
                        <CollecticonHouse />
                      )
                    )}
                  </td>
                </ResultRow>
              ))}
            </tbody>
          </Table>
          <Button
            style={{
              fontSize: '12px',
              letterSpacing: '1px',
            }}
            size="small"
            variation="base-outline"
            radius="square"
            fitting="baggy"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show less' : 'Show more'}
          </Button>
        </CandidatesTableSection>
      )}
      <Footer>
        ⚠️ Those numbers are estimates based on kg CO₂/km averages, which may be
        less accurate than the industry-standard based on other factors such as
        payload, carrier type, layovers, etc.
        <br />
        <a href="https://github.com/developmentseed/co2ordinate">
          Discuss this prototype on the Github repo
        </a>
      </Footer>
    </>
  )
}
