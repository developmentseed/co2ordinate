import { FeatureCollection, Point } from 'geojson'
import { atom } from 'jotai'
import getOnsiteLocations, { Airport, TeamMemberFeature } from '../lib/getOnsiteLocations'

export const airportsAtom = atom<FeatureCollection<Point, Record<string, Airport>> | null>(null)
export const selectedAirportCodeAtom = atom('')
export const selectedTeamMemberNamesAtom = atom<string[]>([])
export const baseTeamMembersAtom = atom<TeamMemberFeature[]>([])
export const customTeamMembersAtom = atom<TeamMemberFeature[]>([])

export const teamMembersAtom = atom((get) => {
  const baseTeamMembers = get(baseTeamMembersAtom)
  const customTeamMembers = get(customTeamMembersAtom)
  if (!baseTeamMembers || !customTeamMembers) return []
  return [...baseTeamMembers, ...customTeamMembers]
});

export const selectedTeamMembersAtom = atom((get) => {
  const selectedTeamMemberNames = get(selectedTeamMemberNamesAtom);
  const baseTeamMembers = get(baseTeamMembersAtom);
  const customTeamMembers = get(customTeamMembersAtom);

  if (!selectedTeamMemberNames || !baseTeamMembers || !customTeamMembers)
    return null;
  const selectedBaseTeamMembers = baseTeamMembers.filter((m) =>
    selectedTeamMemberNames.includes(m.properties.name)
  );
  const selectedCustomTeamMembers = customTeamMembers.filter((m) =>
    selectedTeamMemberNames.includes(m.properties.name)
  );

  return [
    ...selectedBaseTeamMembers,
    ...selectedCustomTeamMembers,
  ];
});


export const resultsAtom = atom((get) => {
  const airports = get(airportsAtom)
  const selectedTeamMembers = get(selectedTeamMembersAtom)
  if (!airports || !selectedTeamMembers) return null

  // Make sure all home airports are present + 5 potentially better candidates, with an overall minimum of 15
  const numCandidates = Math.max(15, selectedTeamMembers.length + 10)

  return getOnsiteLocations(selectedTeamMembers, airports.features, numCandidates, true)
})

export const currentResultAtom = atom((get) => {
  const selectedAirportCode = get(selectedAirportCodeAtom);
  const results = get(resultsAtom);
  if (!selectedAirportCode || !results) return null
  return results.find((r) => r.properties.iata_code === selectedAirportCode)
});

