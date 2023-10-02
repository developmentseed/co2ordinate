import { useState, useEffect, useCallback } from 'react'
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
import TeamMembers from './TeamMembers'
import { media } from '@devseed-ui/theme-provider'
import { Button } from '@devseed-ui/button'
import {
  CollecticonChevronDownSmall,
  CollecticonChevronUpSmall,
} from '@devseed-ui/collecticons'

type PlannerProps = {
  baseTeam: TeamMemberFeature[]
}

const PlannerLayout = styled.main`
  height: 100%;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr min-content;
  ${media.mediumUp`
    grid-template-columns: minmax(30rem, 33vw) 1fr;
  `}
`

const SidePanel = styled.div`
  background: white;
  background-color: #ffffff;
  box-shadow: 0 0 0 1px rgba(68, 63, 63, 0.04),
    0 4px 16px 2px rgba(68, 63, 63, 0.08);
  position: relative;
  z-index: 20;
  display: flex;
  flex-flow: column nowrap;
  overflow: hidden;
  border: 2px solid black;
  grid-column: 1;
  height: max-content;
  align-self: flex-end;
  ${media.mediumUp`
    min-height: initial;
    height: calc(100vh - 3.125rem);
    grid-row: initial;
  `}
`
const MapWrapper = styled.div`
  min-height: 30rem;
  order: -1;
  grid-column: 1;
  height: 100%;
  width: 100%;
  position: relative;
  ${media.mediumUp`
  order: initial;
    min-height: initial;
    grid-column: 2;
    grid-row: initial;
  `}
`
const PanelBody = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
`
const DrawerHeader = styled.header`
  position: relative;
  display: flex;
  &:not(:first-of-type) {
    border-top: 2px solid black;
  }
`
const DrawerHeaderButton = styled(Button)`
  justify-content: space-between;
  font-weight: bold;
  font-size: 1rem;
  letter-spacing: 0.5px;
  border-radius: 0;
  padding: 0.5rem 1rem;
  height: auto;
`
const DrawerBody = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  padding: 0.5rem 1rem;
  gap: 0.25rem;
  font-size: 0.75rem;
  overflow: auto;
  justify-content: flex-start;
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
      localSavedSelectedTeamMembersNames || []
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

  const [panelState, setPanelState] = useState<
    'attendees' | 'locations' | 'both'
  >('both')
  const onToggleHeader = useCallback(
    (header: 'attendees' | 'locations') => {
      if (panelState === 'attendees' || panelState === 'locations') {
        setPanelState('both')
      } else if (header === 'attendees') {
        setPanelState('locations')
      } else {
        setPanelState('attendees')
      }
    },
    [panelState]
  )
  const showAttendeesPanel = panelState === 'attendees' || panelState === 'both'
  const showLocationsPanel = panelState === 'locations' || panelState === 'both'

  return (
    <PlannerLayout>
      <SidePanel>
        <PanelBody>
          <DrawerHeader>
            <DrawerHeaderButton
              onClick={() => onToggleHeader('attendees')}
              fitting="baggy"
            >
              Attendees{' '}
              {showAttendeesPanel ? (
                <CollecticonChevronDownSmall
                  meaningful
                  title="Collapse content"
                />
              ) : (
                <CollecticonChevronUpSmall meaningful title="Expand content" />
              )}
            </DrawerHeaderButton>
          </DrawerHeader>
          {showAttendeesPanel && (
            <DrawerBody>
              <TeamMembers />
              <Button
                onClick={() => setPanelState('locations')}
                size="small"
                style={{
                  fontSize: '10px',
                  fontWeight: 'normal',
                  letterSpacing: '1px',
                }}
                radius="square"
                variation="base-fill"
              >
                Done
              </Button>
            </DrawerBody>
          )}
          <DrawerHeader>
            <DrawerHeaderButton
              onClick={() => onToggleHeader('locations')}
              fitting="baggy"
            >
              Meeting Locations{' '}
              {showLocationsPanel ? (
                <CollecticonChevronDownSmall
                  meaningful
                  title="Collapse content"
                />
              ) : (
                <CollecticonChevronUpSmall meaningful title="Expand content" />
              )}
            </DrawerHeaderButton>
          </DrawerHeader>
          {showLocationsPanel && (
            <DrawerBody>
              <Candidates />
            </DrawerBody>
          )}
        </PanelBody>
      </SidePanel>
      <MapWrapper>
        <Map />
      </MapWrapper>
    </PlannerLayout>
  )
}
