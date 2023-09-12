import { useCallback, useMemo } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import styled from 'styled-components'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Button } from '@devseed-ui/button'
import {
  baseTeamMembersAtom,
  customTeamMembersAtom,
  groupsAtom,
  selectedTeamMemberNamesAtom,
  selectedTeamMembersAtom,
  teamMembersAtom,
  currentResultAtom,
} from './atoms'
import { formatCO2 } from '../lib/getOnsiteLocations'
import Table from './Table'
import GroupsDropdown from './GroupsDropdown'

const TeamMembersRow = styled.tr`
  color: ${({ disabled }) => (disabled ? 'grey' : 'inherit')};
`

const GroupCell = styled.td`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export default function TeamMembers() {
  const [baseTeamMembers, setBaseTeamMembers] = useAtom(baseTeamMembersAtom)
  const [customTeamMembers, setCustomTeamMembers] = useAtom(
    customTeamMembersAtom
  )
  const selectedTeamMembers = useAtomValue(selectedTeamMembersAtom)
  const [selectedTeamMemberNames, setSelectedTeamMemberNames] = useAtom(
    selectedTeamMemberNamesAtom
  )
  const team = useAtomValue(teamMembersAtom)
  const groups = useAtomValue(groupsAtom)

  const currentResult = useAtomValue(currentResultAtom)

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
  }, [team, currentResult, customTeamMembers, selectedTeamMembers])


  return (
    <>
      <h2>2. Select who is coming</h2>
      <em>Please select at least 2 team members to show results.</em>
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
              {groups?.length ? (
                <GroupCell>
                  {atm.properties.group} <GroupsDropdown teamMember={atm} />
                </GroupCell>
              ) : null}
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
  )
}
