import { FeatureCollection, Geometry, Point } from 'geojson'
import { atom } from 'jotai'
import getOnsiteLocations, { Airport, TeamMember } from './getOnsiteLocations'
import DEFAULT_TEAM from '../exampleTeam'

export const airportsAtom = atom<FeatureCollection<Point, Record<string, Airport>> | null>(null)
export const selectedAirportCodeAtom = atom('')
export const selectedTeamMembersAtom = atom<any | null>(null)
export const baseTeamMembersAtom = atom<TeamMember[]>([])
export const customTeamMembersAtom = atom<TeamMember[]>([])

export const teamAtom = atom((get) => {
  const baseTeamMembers = get(baseTeamMembersAtom)
  const customTeamMembers = get(customTeamMembersAtom)
  if (!baseTeamMembers || !customTeamMembers) return null
  return [...DEFAULT_TEAM, ...customTeamMembers]
});

export const resultsAtom = atom((get) => {
  const airports = get(airportsAtom)
  const selectedTeamMembers = get(selectedTeamMembersAtom)
  if (!airports || !selectedTeamMembers) return null

  return getOnsiteLocations(selectedTeamMembers, airports.features).slice(
    0,
    1000
  )
})

export const currentResultAtom = atom((get) => {
  const selectedAirportCode = get(selectedAirportCodeAtom);
  const results = get(resultsAtom);
  if (!selectedAirportCode || !results) return null
  return results.find((r) => r.properties.iata_code === selectedAirportCode)
});

