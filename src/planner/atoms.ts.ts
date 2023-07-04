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

  // Make sure all home airports are present + 5 potentially better candidates, with an overall minimum of 15
  const numCandidates = Math.max(15, selectedTeamMembers.length + 5)

  return getOnsiteLocations(selectedTeamMembers, airports.features, numCandidates, true)
})

export const currentResultAtom = atom((get) => {
  const selectedAirportCode = get(selectedAirportCodeAtom);
  const results = get(resultsAtom);
  if (!selectedAirportCode || !results) return null
  return results.find((r) => r.properties.iata_code === selectedAirportCode)
});

