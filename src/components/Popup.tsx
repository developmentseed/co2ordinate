import { useState } from 'react'

export default function Popup({
  onSubmit,
}: {
  onSubmit: (name: string) => void
}) {
  const [name, setName] = useState('')
  return (
    <div>
      <h1>Add team member</h1>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={() => onSubmit(name)} disabled={name === ''}>Submit</button>
    </div>
  )
}
