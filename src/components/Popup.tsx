import { useAtomValue } from 'jotai'
import { useState } from 'react'
import Creatable from 'react-select/creatable'
import { groupsAtom } from './atoms.ts'

export default function Popup({
  onSubmit,
}: {
  onSubmit: (name: string, group: string | null) => void
}) {
  const [name, setName] = useState('')
  const groups = useAtomValue(groupsAtom)
  const groupsOptions = groups.map((group) => ({
    label: group,
    value: group,
  }))

  const [selectedGroup, setSelectedGroup] = useState(null)
  const onSelectGroup = (option: any) => {
    setSelectedGroup(option)
  }
  return (
    <>
      <h1>Add team member</h1>
      <div>
        Name:
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        Group (optional):
        <Creatable
          isClearable
          options={groupsOptions}
          onChange={onSelectGroup}
          value={selectedGroup}
          placeholder="Select or type..."
        />
      </div>
      <button
        onClick={() => onSubmit(name, selectedGroup?.value)}
        disabled={name === ''}
      >
        Submit
      </button>
    </>
  )
}
