import { Feature, Point } from 'geojson'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import Select from 'react-select'
import styled from 'styled-components'
import 'maplibre-gl/dist/maplibre-gl.css'
import countryCodeEmoji from 'country-code-emoji'
import Map from './Map'
import {
  airportsAtom,
  baseTeamMembersAtom,
  resultsAtom,
  selectedAirportCodeAtom,
  selectedTeamMembersAtom,
  teamAtom,
} from './atoms.ts'
import { Result, formatCO2 } from './getOnsiteLocations'
import { currentResultAtom } from './atoms.ts'
import useEquivalent from './useEquivalent'

type TeamMemberProps = {
  name: string
  team: string
}
type TeamMember = Feature<Point, TeamMemberProps>

type PlannerProps = {
  baseTeam: TeamMember[]
}

const THEME_COLOR = '#ff002c'

const MapWrapper = styled.div`
  height: 100%;
  width: 100%;
  position: relative;
`

const Overlay = styled.div`
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 100;
  padding: 2rem;
  pointer-events: none;
`

const Panel = styled.div`
  background: white;
  min-width: 400px;
  max-width: 30vw;
  margin-bottom: 2rem;
  pointer-events: all;
  padding: 1rem;

  & > h2 {
    font-size: 1.2rem;
  }
`

const TeamSelector = styled(Panel)``

const TeamMembers = styled(Panel)`
  min-height: 30vh;
  max-height: 40vh;
  overflow: scroll;
`

const Candidates = styled(Panel)`
  background: white;
  justify-content: center;
  width: 100%;
  min-width: 100%;
  max-width: 100%;
`

const CandidatesTableSection = styled.div`
  flex: 1;
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
  const [selectedTeamMembers, setSelectedTeamMembers] = useAtom(
    selectedTeamMembersAtom
  )
  const [selectedAirportCode, setSelectedAirportCode] = useAtom(
    selectedAirportCodeAtom
  )
  const results = useAtomValue(resultsAtom)
  const team = useAtomValue(teamAtom)

  const currentResult = useAtomValue(currentResultAtom)

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

  const onToggleTeamMember = useCallback(
    (teamMember) => {
      const selected = selectedTeamMembers.find(
        (t) => t.properties.name === teamMember
      )
      if (selected) {
        const newSelection = selectedTeamMembers.filter(
          (t) => t.properties.name !== teamMember
        )
        setSelectedTeamMembers(newSelection)
      } else {
        const newSelection = [
          ...selectedTeamMembers,
          ...team.filter((t) => t.properties.name === teamMember),
        ]
        setSelectedTeamMembers(newSelection)
      }
    },
    [selectedTeamMembers]
  )

  const teamWithSelected = useMemo(() => {
    if (!team?.length) return []

    const withSelected = team.map((t) => {
      const isSelected = selectedTeamMembers.find(
        (st) => st.properties.name === t.properties.name
      )
      const airportTeamMember = currentResult?.properties.airportTeamMembers.find(
        (st) => st.properties.name === t.properties.name
      )

      return {
        ...t,
        properties: {
          ...t.properties,
          // TODO: sould be in properties
          isSelected,
          ...airportTeamMember,
        },
      }
    }).toSorted((a, b) => a.properties.name.localeCompare(b.properties.name))


    return withSelected
  }, [team, currentResult])

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

  const equivalent = useEquivalent(currentResult)

  return (
    <>
      <MapWrapper>
        <Map />
      </MapWrapper>
      <Overlay>
        <TeamSelector>
          <h2>1. Add team members</h2>
          <ul>
            <li>Click on the map to set participant locations</li>
            <li>
              <input placeholder="Search locations to set points"></input>
            </li>
            <li>Upload CSV (must include lat, lon columns)</li>
          </ul>
        </TeamSelector>

        <TeamMembers>
          <h2>2. Select who is coming</h2>
          Please select at least 2 team members to show results.
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
          {teamWithSelected.length && (
            <>
              <Table>
                <tbody>
                  <tr>
                    <th></th>
                    <th>
                      {/* TODO */}
                      {/* <input type="checkbox" /> */}
                    </th>
                    <th>Name</th>
                    <th>CO₂</th>
                    <th>Total dist</th>
                  </tr>
                  {teamWithSelected.map((atm) => (
                    <TeamMembersRow
                      key={atm.properties.name}
                      disabled={atm.distance === null}
                      title={
                        atm.distance === null
                          ? 'Team member does not have coordinates'
                          : ''
                      }
                    >
                      <td><img src='./user.png'></img></td>
                      <td>
                        <input
                          type="checkbox"
                          checked={atm.properties.isSelected}
                          onChange={() =>
                            onToggleTeamMember(atm.properties.name)
                          }
                        />
                      </td>
                      <td>{atm.properties.name}</td>
                      <td>
                        {atm.properties.co2
                          ? formatCO2(atm.properties.co2)
                          : '-'}
                      </td>
                      <td>
                        {atm.properties.distance
                          ? Math.round(atm.properties.distance)
                          : '-'}{' '}
                        km
                      </td>
                    </TeamMembersRow>
                  ))}
                </tbody>
              </Table>

            </>
          )}
        </TeamMembers>

        {!!results?.length && (
          <Candidates>
            <CandidatesTableSection>
              {currentResult && (
                <h2>
                  Travelling to {currentResult.properties.municipality}:{' '}
                  {currentResult.properties.airportTeamMembers.length} people -{' '}
                  {formatCO2(currentResult.properties.totalCO2)}
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
                        () =>
                          setSelectedAirportCode(result.properties.iata_code)
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
            </CandidatesTableSection>
            <Footer>
                ⚠️ Those numbers are estimates based on kg CO₂/km averages,
                which may be less accurate than the industry-standard based on
                other factors such as payload, carrier type, layovers, etc.
                <br />
                <a href="https://github.com/developmentseed/meet-and-greta">
                  Discuss this prototype on the Github repo
                </a>
              </Footer>
          </Candidates>
        )}
      </Overlay>
    </>
  )
}
