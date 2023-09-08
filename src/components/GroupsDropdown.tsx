import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Dropdown, DropMenu, DropMenuItem } from '@devseed-ui/dropdown'
import { ToolbarIconButton } from '@devseed-ui/toolbar'
import { CollecticonEllipsisVertical } from '@devseed-ui/collecticons'
import {
  groupsAtom,
  selectedTeamMemberNamesAtom,
  selectedTeamMembersAtom,
  teamMembersAtom,
} from './atoms'
import { TeamMemberFeature } from '../lib/getOnsiteLocations'
import { useCallback } from 'react'

export default function GroupsDropdown({
  teamMember,
}: {
  teamMember: TeamMemberFeature
}) {
  // const groups = useAtomValue(groupsAtom)
  // const groupsWithoutCurrent = groups.filter(
  //   (group) => group !== teamMember.properties.group
  // )

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

  return (
    <Dropdown
      alignment="right"
      triggerElement={(props) => (
        <ToolbarIconButton variation="base-text" {...props}>
          <CollecticonEllipsisVertical title="More options" meaningful />
        </ToolbarIconButton>
      )}
    >
      {/* {groupsWithoutCurrent.length && (
        <DropMenu>
          {groupsWithoutCurrent.map((group) => (
            <DropMenuItem onClick={() => changeTeamMemberGroup(group)} key={group}>Move to group: {group}</DropMenuItem>
          ))}
        </DropMenu>
      )} */}
      <DropMenu>
        <DropMenuItem onClick={selectAllGroup}>
          Select all members from group {teamMember.properties.group}
        </DropMenuItem>
        <DropMenuItem onClick={deselectAllGroup}>
          Deselect all members from group {teamMember.properties.group}
        </DropMenuItem>
      </DropMenu>
    </Dropdown>
  )
}
