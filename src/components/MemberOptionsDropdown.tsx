import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Dropdown, DropMenu, DropMenuItem } from '@devseed-ui/dropdown'
import { ToolbarIconButton } from '@devseed-ui/toolbar'
import { CollecticonEllipsisVertical } from '@devseed-ui/collecticons'
import {
  baseTeamMembersAtom,
  customTeamMembersAtom,
  selectedTeamMemberNamesAtom,
  teamMembersAtom,
} from './atoms'
import { TeamMemberFeature } from '../lib/getOnsiteLocations'
import { useCallback } from 'react'

export default function MemberOptionsDropdown({
  teamMember,
}: {
  teamMember: TeamMemberFeature
}) {
  const [baseTeamMembers, setBaseTeamMembers] = useAtom(baseTeamMembersAtom)
  const [customTeamMembers, setCustomTeamMembers] = useAtom(
    customTeamMembersAtom
  )

  const teamMembers = useAtomValue(teamMembersAtom)
  const [selectedTeamMemberNames, setSelectedTeamMemberNames] = useAtom(
    selectedTeamMemberNamesAtom
  )

  const selectAllGroup = useCallback(() => {
    const members = teamMembers.filter(
      (member) =>
        member.properties.group === teamMember.properties.group ||
        selectedTeamMemberNames.includes(member.properties.name)
    )
    const memberNames = members.map((member) => member.properties.name)
    setSelectedTeamMemberNames(memberNames)
  }, [teamMembers, teamMember, selectedTeamMemberNames])

  const deselectAllGroup = useCallback(() => {
    const members = teamMembers.filter(
      (member) => member.properties.group === teamMember.properties.group
    )
    const memberNames = members.map((member) => member.properties.name)
    const newSelectedTeamMemberNames = selectedTeamMemberNames.filter(
      (name) => !memberNames.includes(name)
    )
    setSelectedTeamMemberNames(newSelectedTeamMemberNames)
  }, [teamMembers, teamMember, selectedTeamMemberNames])

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
  return (
    <Dropdown
      alignment="right"
      triggerElement={(props) => (
        <ToolbarIconButton size="small" variation="base-text" {...props}>
          <CollecticonEllipsisVertical title="More options" meaningful />
        </ToolbarIconButton>
      )}
    >
      <DropMenu style={{ fontSize: '0.75rem', fontWeight: 'normal'}}>
        <DropMenuItem onClick={() => onDeleteTeamMember(teamMember)}>
          Delete Attendee
        </DropMenuItem>
        {teamMember.properties.group && (
          <>
            <DropMenuItem onClick={selectAllGroup}>
              Select all members from group {teamMember.properties.group}
            </DropMenuItem>
            <DropMenuItem onClick={deselectAllGroup}>
              Deselect all members from group {teamMember.properties.group}
            </DropMenuItem>{' '}
          </>
        )}
      </DropMenu>
    </Dropdown>
  )
}
