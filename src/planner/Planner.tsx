import { Feature, Point } from 'geojson'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import Select from 'react-select'
import styled from 'styled-components'
import 'maplibre-gl/dist/maplibre-gl.css'
import countryCodeEmoji from 'country-code-emoji'
import MapWrapper from './Map'
import { airportsAtom, baseTeamMembersAtom, resultsAtom, selectedAirportCodeAtom, selectedTeamMembersAtom, teamAtom } from './atoms.ts'
import { Result, formatCO2 } from './getOnsiteLocations'

type TeamMemberProps = {
  name: string
  team: string
}
type TeamMember = Feature<Point, TeamMemberProps>

type PlannerProps = {
  baseTeam: TeamMember[]
}

const THEME_COLOR = '#ff002c'

const Candidates = styled.div`
  display: flex;
  justify-content: center;
`

const CandidatesTableSection = styled.div`
  max-height: 0.5vh;
  min-height: 540px;
  flex: 1;
  overflow: scroll;
`

const Table = styled.table`
  width: 100%;
  tr > th {
    text-align: left;
  }
`
const ResultRow = styled.tr`
  cursor: pointer;
  background: ${({ selected }) => (selected ? THEME_COLOR : 'transparent')};
  color: ${({ selected }) => (selected ? 'white' : 'inherit')};
  :hover {
    background: #ddd;
  }
`

const TeamMembersSection = styled.div`
  max-width: 600px;
`
const TeamMembersRow = styled.tr`
  color: ${({ disabled }) => (disabled ? 'grey' : 'inherit')};
`

const Equivalent = styled.p`
  margin: 0.5rem 0 1rem;
`

const Footer = styled.div`
  margin-top: 2rem;
`

export function Planner({ baseTeam }: PlannerProps) {
  const setAirports = useSetAtom(airportsAtom)
  const setBaseTeamMembers = useSetAtom(baseTeamMembersAtom)
  const [selectedTeamMembers, setSelectedTeamMembers] = useAtom(selectedTeamMembersAtom)
  const [selectedAirportCode, setSelectedAirportCode] = useAtom(selectedAirportCodeAtom)
  const results = useAtomValue(resultsAtom)
  const team = useAtomValue(teamAtom)

  useEffect(() => {
    setBaseTeamMembers(baseTeam)
  }, [baseTeam])

  const selectEntries = useMemo(() => {
    if (!team?.length) return []
    const teams = team.reduce((acc: string[], t: TeamMember) => {
      if (!acc.includes(t.properties.team)) acc.push(t.properties.team)
      return acc
    }, [])
    if (!teams) return team
    return [
      { properties: { id: 'ALL', name: 'ALL TEAMS' } },
      ...teams.map((p) => ({
        properties: { id: p, type: 'team', name: `TEAM: ${p}` },
      })),
      ...team,
    ]
  }, [team])

  const onSelectTeamMembers = useCallback(
    (teamMembers) => {
      const populatedSelection = teamMembers.flatMap((teamMember) => {
        if (teamMember.properties.id === 'ALL') return [...team]
        else if (teamMember.properties.type === 'team') {
          return [
            ...team.filter(
              (t) => t.properties.team === teamMember.properties.id
            ),
          ]
        } else return [teamMember]
      })

      // remove duplicates
      const dedupSelection = []
      populatedSelection.forEach((teamMember) => {
        if (
          !dedupSelection.filter(
            (t) => t.properties.name === teamMember.properties.name
          ).length
        ) {
          dedupSelection.push(teamMember)
        }
      })

      setSelectedTeamMembers(dedupSelection)
    },
    [team]
  )

  // TODO: Group airports by urban area
  useEffect(() => {
    fetch(
      'https://raw.githubusercontent.com/nerik/airports-streamlined/main/airports_large_medium.geojson'
    )
      .then((response) => response.json())
      .then((data) => {
        setAirports(data)
      })
  }, [])



  // Set selected result the first time, once we have results
  useEffect(() => {
    if (!selectedAirportCode && results?.length) {
      setSelectedAirportCode(results[0].properties.iata_code)
    }
  }, [selectedAirportCode, results])

  // Select first result every time results change
  useEffect(() => {
    if (results?.length) setSelectedAirportCode(results[0].properties.iata_code)
  }, [results])

  const currentResult: Feature<Point, Result> = useMemo(() => {
    if (!selectedAirportCode || !results) return null
    return results.find((r) => r.properties.iata_code === selectedAirportCode)
  }, [results, selectedAirportCode])


  const equivalent = useMemo(() => {
    if (!currentResult) return null
    const formatCO2 = (currentResult, factor) =>
      (currentResult.properties.totalCO2 / factor).toFixed(2)
    return [
      [
        `🇮🇳 approx. ${formatCO2(currentResult, 1930)} 
    times what an average Indian citizen emits per year`,
        'https://ourworldindata.org/grapher/co-emissions-per-capita',
      ],
      [
        `🧊 equivalent to approx. ${formatCO2(
          currentResult,
          1000 / 3
        )}  square meters of Arctic sea ice loss`,
        'https://science.sciencemag.org/content/354/6313/747',
      ],
      [
        `🍔 equivalent to the emissions of approx. ${formatCO2(
          currentResult,
          1.8
        )} cheese burgers`,
        'https://www.sixdegreesnews.org/archives/10261/the-carbon-footprint-of-a-cheeseburger',
      ],
      [
        `🚗 equivalent to approx. ${formatCO2(
          currentResult,
          0.15
        )} kilometers travelled with a small car`,
        'https://ourworldindata.org/travel-carbon-footprint',
      ],
    ][Math.floor(Math.random() * 4)]
  }, [currentResult])

  return (
    <>
      <Select
        isMulti
        placeholder={
          selectEntries.length
            ? 'Select at least 2 team members...'
            : 'Loading...'
        }
        name="colors"
        options={selectEntries}
        className="basic-multi-select"
        classNamePrefix="select"
        getOptionLabel={(option) => option.properties.name}
        getOptionValue={(option) => option.properties.name}
        onChange={onSelectTeamMembers}
        value={selectedTeamMembers}
      />
      <Candidates>
        <CandidatesTableSection>
          {' '}
          {results?.length ? (
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
                    selected={result.properties.iata_code === selectedAirportCode}
                  >
                    <td>
                      {result.properties.municipality} (
                      {result.properties.iata_code})
                    </td>
                    <td>
                      {result.properties.iso_country}{' '}
                      {countryCodeEmoji(result.properties.iso_country)}{' '}
                    </td>
                    <td>{formatCO2(result.properties.totalCO2)}</td>
                    <td>{Math.round(result.properties.totalKm)} km</td>
                    <td>
                      {result.properties.homeAirportCount
                        ? '🏡'.repeat(result.properties.homeAirportCount)
                        : ''}
                    </td>
                  </ResultRow>
                ))}
              </tbody>
            </Table>
          ) : (
            'Please select at least 2 team members to show results.'
          )}
        </CandidatesTableSection>
        <MapWrapper />
      </Candidates>
      {currentResult && (
        <TeamMembersSection>
          <h2>
            Travelling to {currentResult.properties.municipality}:{' '}
            {currentResult.properties.airportTeamMembers.length} people -{' '}
            {formatCO2(currentResult.properties.totalCO2)}
          </h2>
          {equivalent && (
            <Equivalent>
              {equivalent[0]} (<a href={equivalent[1]}>source</a>)
            </Equivalent>
          )}

          <Table>
            <tbody>
              <tr>
                <th>Name</th>
                <th>CO₂</th>
                <th>Total dist</th>
              </tr>
              {currentResult.properties.airportTeamMembers.map((atm) => (
                <TeamMembersRow
                  key={atm.properties.name}
                  disabled={atm.distance === null}
                  title={
                    atm.distance === null
                      ? 'Team member does not have coordinates'
                      : ''
                  }
                >
                  <td>{atm.properties.name}</td>
                  <td>{atm.co2 !== null ? formatCO2(atm.co2) : '-'}</td>
                  <td>
                    {atm.distance !== null ? Math.round(atm.distance) : '-'} km
                  </td>
                </TeamMembersRow>
              ))}
            </tbody>
          </Table>
          <Footer>
            ⚠️ Those numbers are estimates based on kg CO₂/km averages, which
            may be less accurate than the industry-standard based on other
            factors such as payload, carrier type, layovers, etc.
            <br />
            <a href="https://github.com/developmentseed/meet-and-greta">
              Discuss this prototype on the Github repo
            </a>
          </Footer>
        </TeamMembersSection>
      )}
    </>
  )
}
