import { useCallback, useEffect, useMemo } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import Select from 'react-select'
import styled from 'styled-components'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Button } from '@devseed-ui/button'
import Map from './Map'
import {
  airportsAtom,
  baseTeamMembersAtom,
  customTeamMembersAtom,
  groupsAtom,
  resultsAtom,
  selectedAirportCodeAtom,
  selectedTeamMemberNamesAtom,
  selectedTeamMembersAtom,
  teamMembersAtom,
  currentResultAtom,
} from './atoms'
import { TeamMemberFeature, formatCO2 } from '../lib/getOnsiteLocations'
import { Candidates } from './Candidates'
import AddTeam from './AddTeam'

type PlannerProps = {
  baseTeam: TeamMemberFeature[]
}

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
  padding: 1rem;
  pointer-events: none;
`

const Panel = styled.div`
  background: white;
  min-width: 450px;
  max-width: 30vw;
  margin-bottom: 1rem;
  pointer-events: all;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);

  & > h2 {
    font-size: 1.1rem;
  }
`

const AddTeamWrapper = styled(Panel)``

const TeamMembers = styled(Panel)`
  min-height: 30vh;
  max-height: 40vh;
  overflow: scroll;
`

const CandidatesWrapper = styled(Panel)`
  background: white;
  justify-content: center;
  width: 100%;
  min-width: 100%;
  max-width: 100%;
`

export const Table = styled.table`
  width: 100%;
  tr > th {
    text-align: left;
  }
`

const TeamMembersRow = styled.tr`
  color: ${({ disabled }) => (disabled ? 'grey' : 'inherit')};
`

export function Planner({ baseTeam }: PlannerProps) {
  const setAirports = useSetAtom(airportsAtom)
  const [baseTeamMembers, setBaseTeamMembers] = useAtom(baseTeamMembersAtom)
  const [customTeamMembers, setCustomTeamMembers] = useAtom(
    customTeamMembersAtom
  )
  const selectedTeamMembers = useAtomValue(selectedTeamMembersAtom)
  const [selectedTeamMemberNames, setSelectedTeamMemberNames] = useAtom(
    selectedTeamMemberNamesAtom
  )
  const [selectedAirportCode, setSelectedAirportCode] = useAtom(
    selectedAirportCodeAtom
  )
  const results = useAtomValue(resultsAtom)
  const team = useAtomValue(teamMembersAtom)
  const groups = useAtomValue(groupsAtom)

  const currentResult = useAtomValue(currentResultAtom)

  useEffect(() => {
    const localSavedTeamMembers = JSON.parse(
      localStorage.getItem('teamMembers')
    )
    const localSavedSelectedTeamMembersNames = JSON.parse(
      localStorage.getItem('selectedTeamMemberNames')
    )
    setBaseTeamMembers(localSavedTeamMembers || baseTeam)
    setSelectedTeamMemberNames(
      localSavedSelectedTeamMembersNames || [
        'Jules Verne',
        'Octavia Butler',
        'Salim Ali',
        'Stanislas Lem',
        'Ursula K. Le Guin',
        'Wangari Maathai',
      ]
    )
  }, [baseTeam])

  useEffect(() => {
    localStorage.setItem('teamMembers', JSON.stringify(team))
  }, [team])

  useEffect(() => {
    localStorage.setItem(
      'selectedTeamMemberNames',
      JSON.stringify(selectedTeamMemberNames)
    )
  }, [selectedTeamMemberNames])

  const selectEntries = useMemo(() => {
    if (!team?.length) return []

    if (!groups) return team
    return [
      { properties: { id: 'ALL', name: 'ENTIRE TEAM' } },
      ...groups.map((p) => ({
        properties: { id: p, type: 'group', name: `GROUP: ${p}` },
      })),
      ...team,
    ]
  }, [team, groups])

  const onSelectTeamMembers = useCallback(
    (teamMembers) => {
      const populatedSelection = teamMembers.flatMap((teamMember) => {
        if (teamMember.properties.id === 'ALL') return [...team]
        else if (teamMember.properties.type === 'group') {
          return [
            ...team.filter(
              (t) => t.properties.group === teamMember.properties.id
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

      setSelectedTeamMemberNames(dedupSelection.map((t) => t.properties.name))
    },
    [team]
  )

  const onToggleTeamMember = useCallback(
    (teamMemberName) => {
      const selected = selectedTeamMemberNames.includes(teamMemberName)
      if (selected) {
        setSelectedTeamMemberNames(
          selectedTeamMemberNames.filter((t) => t !== teamMemberName)
        )
      } else {
        setSelectedTeamMemberNames([...selectedTeamMemberNames, teamMemberName])
      }
    },
    [selectedTeamMemberNames]
  )

  const onDeleteTeamMember = useCallback(
    (teamMember) => {
      const container = teamMember.properties.isCustom
        ? customTeamMembers
        : baseTeamMembers
      const del = teamMember.properties.isCustom
        ? setCustomTeamMembers
        : setBaseTeamMembers
      const newSelection = container.filter(
        (t) => t.properties.name !== teamMember.properties.name
      )
      del(newSelection)
      setSelectedTeamMemberNames(
        selectedTeamMemberNames.filter((t) => t !== teamMember.properties.name)
      )
    },
    [
      setCustomTeamMembers,
      setBaseTeamMembers,
      customTeamMembers,
      baseTeamMembers,
    ]
  )

  const onDeleteAllTeamMembers = useCallback(() => {
    setCustomTeamMembers([])
    setBaseTeamMembers([])
    setSelectedTeamMemberNames([])
  }, [setCustomTeamMembers, setBaseTeamMembers, setSelectedTeamMemberNames])

  const teamWithSelected = useMemo(() => {
    if (!team?.length) return []

    const withSelected = team
      .map((t) => {
        const isSelected = selectedTeamMembers.find(
          (st) => st.properties.name === t.properties.name
        )
        const airportTeamMember =
          currentResult?.properties.airportTeamMembers.find(
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
      })
      .toSorted((a, b) => a.properties.name.localeCompare(b.properties.name))

    return withSelected
  }, [team, currentResult, customTeamMembers])

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

  return (
    <>
      <MapWrapper>
        <Map />
      </MapWrapper>
      <Overlay>
        <AddTeamWrapper>
          <AddTeam />
        </AddTeamWrapper>

        <TeamMembers>
          <h2>2. Select who is coming</h2>
          <em>Please select at least 2 team members to show results.</em>
          <Select
            isMulti
            placeholder={
              selectEntries.length
                ? 'Select at least 2 team members...'
                : 'Add team members first 👆'
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

          <>
            <Table>
              <tbody>
                {!!teamWithSelected.length && (
                  <tr>
                    <th></th>
                    <th>
                      {/* TODO */}
                      {/* <input type="checkbox" /> */}
                    </th>
                    <th>Name</th>
                    {groups?.length ? <th>Group</th> : null}
                    <th>CO₂</th>
                    <th>Total dist</th>
                    <th>
                      {' '}
                      <Button
                        radius="rounded"
                        size="small"
                        variation="base-outline"
                        onClick={onDeleteAllTeamMembers}
                      >
                        <img src="./trash-bin.svg"></img>
                      </Button>
                    </th>
                  </tr>
                )}
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
                    <td>
                      <img src="./user.png"></img>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={atm.properties.isSelected}
                        onChange={() => onToggleTeamMember(atm.properties.name)}
                      />
                    </td>
                    <td>{atm.properties.name}</td>
                    {groups?.length ? <td>{atm.properties.group}</td> : null}
                    <td>
                      {atm.properties.co2 ? formatCO2(atm.properties.co2) : '-'}
                    </td>
                    <td>
                      {atm.properties.distance
                        ? Math.round(atm.properties.distance)
                        : '-'}{' '}
                      km
                    </td>
                    <td>
                      <Button
                        radius="rounded"
                        size="small"
                        variation="base-outline"
                        onClick={() => onDeleteTeamMember(atm)}
                      >
                        <img src="./trash-bin.svg"></img>
                      </Button>
                    </td>
                  </TeamMembersRow>
                ))}
              </tbody>
            </Table>
          </>
        </TeamMembers>

        {!!results?.length && (
          <CandidatesWrapper>
            <Candidates />
          </CandidatesWrapper>
        )}
      </Overlay>
    </>
  )
}
