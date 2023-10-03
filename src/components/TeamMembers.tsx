import { useCallback, useMemo } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import styled from 'styled-components'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Button } from '@devseed-ui/button'
import {
  CollecticonCrosshair,
  CollecticonEllipsisVertical,
} from '@devseed-ui/collecticons'
import { Dropdown, DropMenu, DropMenuItem } from '@devseed-ui/dropdown'
import { Drop } from './Drop'

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
import Table, { StackedTd } from './Table'
import MemberOptionsDropdown from './MemberOptionsDropdown'

const TeamMembersRow = styled.tr`
  color: ${({ disabled }) => (disabled ? 'grey' : 'inherit')};
`

const GroupCell = styled.td`
  display: flex;
  align-items: center;
  justify-content: space-between;
`
const AddTeamOptions = styled.ul`
  list-style: none;
  padding: 0;
  & > li:not(:last-child):after {
    display: block;
    width: 100%;
    text-align: center;
    height: 12px;
    content: 'or';
  }
  & > li:first-child > strong {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  & em {
    display: block;
  }
  padding-bottom: 0.5rem;
  border-bottom: 1px solid black;
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

  const onDeleteAllTeamMembers = useCallback(() => {
    setCustomTeamMembers([])
    setBaseTeamMembers([])
    setSelectedTeamMemberNames([])
  }, [setCustomTeamMembers, setBaseTeamMembers, setSelectedTeamMemberNames])

  const teamWithSelected = useMemo(() => {
    if (!team?.length) return []

    const withSelected = team
      .map((t) => {
        const isSelected =
          selectedTeamMembers.find(
            (st) => st.properties.name === t.properties.name
          ) !== undefined
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
      <AddTeamOptions>
        <li>
          <strong>
            <CollecticonCrosshair /> Click on the map to set attendee locations
          </strong>
        </li>
        <li>
          <strong>Add CSV file</strong>
          <em>Must include name, lat, lon columns. Optional 'group' column.</em>
          <Drop />
        </li>
      </AddTeamOptions>
      <Table>
        <tbody>
          {!!teamWithSelected.length && (
            <tr>
              <th>
                {/* TODO */}
                {/* <input type="checkbox" /> */}
              </th>
              <th>Attendee</th>
              <th>CO₂</th>
              <th>Distance</th>
              <th>
                <Dropdown
                  alignment="right"
                  triggerElement={(props) => (
                    <Button size="small" fitting="skinny" {...props}>
                      <CollecticonEllipsisVertical
                        meaningful
                        title="Show options"
                      />
                    </Button>
                  )}
                >
                  <DropMenu>
                    <DropMenuItem
                      style={{ fontSize: '12px' }}
                      onClick={onDeleteAllTeamMembers}
                    >
                      Delete All Attendees
                    </DropMenuItem>
                  </DropMenu>
                </Dropdown>
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
                <input
                  type="checkbox"
                  checked={atm.properties.isSelected}
                  onChange={() => onToggleTeamMember(atm.properties.name)}
                />
              </td>
              <StackedTd>
                {atm.properties.name}
                {!!groups?.length && <span>{atm.properties.group}</span>}
              </StackedTd>
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
                <MemberOptionsDropdown teamMember={atm} />
              </td>
            </TeamMembersRow>
          ))}
        </tbody>
      </Table>
    </>
  )
}
