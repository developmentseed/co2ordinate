import { useEffect } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import styled from 'styled-components'
import 'mapbox-gl/dist/mapbox-gl.css'
import Map from './Map'
import {
  airportsAtom,
  baseTeamMembersAtom,
  resultsAtom,
  selectedAirportCodeAtom,
  selectedTeamMemberNamesAtom,
  teamMembersAtom,
} from './atoms'
import { TeamMemberFeature, formatCO2 } from '../lib/getOnsiteLocations'
import { Candidates } from './Candidates'
import AddTeam from './AddTeam'
import TeamMembers from './TeamMembers'

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

const TeamMembersWrapper = styled(Panel)`
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

export function Planner({ baseTeam }: PlannerProps) {
  const setAirports = useSetAtom(airportsAtom)
  const setBaseTeamMembers = useSetAtom(baseTeamMembersAtom)
  const [selectedTeamMemberNames, setSelectedTeamMemberNames] = useAtom(
    selectedTeamMemberNamesAtom
  )
  const [selectedAirportCode, setSelectedAirportCode] = useAtom(
    selectedAirportCodeAtom
  )
  const results = useAtomValue(resultsAtom)
  const team = useAtomValue(teamMembersAtom)

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

  // Load airports
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

        <TeamMembersWrapper>
          <TeamMembers />
        </TeamMembersWrapper>

        {!!results?.length && (
          <CandidatesWrapper>
            <Candidates />
          </CandidatesWrapper>
        )}
      </Overlay>
    </>
  )
}
