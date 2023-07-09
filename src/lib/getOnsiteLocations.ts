import bbox from '@turf/bbox'
import getDistance from '@turf/distance'
import greatCircle from '@turf/great-circle'
import getGreatCircle from '@turf/great-circle'
import { featureCollection } from '@turf/helpers'
import { Feature, Point } from 'geojson'
import { ckmeans } from 'simple-statistics'

export interface TeamMember {
  name: string
  team: string
}

export type TeamMemberFeature = Feature<Point, TeamMember>

export interface Airport {
  municipality: string
  iata_code: string
  iso_country: string
  type: 'large_airport' | 'medium_airport'
}

export interface AirportTeamMember extends TeamMemberFeature {
  distance: number | null
  co2: number | null
  homeAirportCode: string | null
}
export interface Result extends Airport {
  airportTeamMembers: AirportTeamMember[]
  totalKm: number
  totalCO2: number
  homeAirportCount: number
}

// https://en.wikipedia.org/wiki/Flight_length
const LONG_HAUL_THRESHOLD = 4000
const SHORT_HAUL_THRESHOLD = 800
const NO_FLIGHT_THRESHOLD = 200

const DOMESTIC_CO2_PER_KM = 0.255
const LONG_HAUL_CO2_PER_KM = 0.15
const SHORT_HAUL_CO2_PER_KM = 0.156


function getCO2(distKm: number) {
  // Under that threshold consider team member will use train
  // TODO obviously only works in Europe/NW corridor/some parts of Asia, filter with country code?
  // TODO make it configureable
  if (distKm < NO_FLIGHT_THRESHOLD) return 0
  const flightTypeMultiplicator =
    distKm < SHORT_HAUL_THRESHOLD
      ? DOMESTIC_CO2_PER_KM
      : distKm < LONG_HAUL_THRESHOLD
      ? SHORT_HAUL_CO2_PER_KM
      : LONG_HAUL_CO2_PER_KM
  return distKm * flightTypeMultiplicator
}

export default function getOnsiteLocations(
  teamMembers: Feature<Point, TeamMember>[],
  airports: Feature<Point, Airport>[],
  maxResults = 10,
  alwaysIncludeHomeAirports = true,
): Feature<Point, Result>[] {
  if (teamMembers.length < 2) return []

  let airportsList = [...airports]

  // Get bbox for all team members
  const [minX, minY, maxX, maxY] = bbox(featureCollection(teamMembers))

  // Filter airports falling within bbox
  // const airportsInBBox = airports.filter((airport) => {
  //   const [x, y] = airport.geometry.coordinates;
  //   return x > minX && x < maxX && y > minY && y < maxY;
  // });

  // For each team member pick only one airport close to home
  const teamMembersList = teamMembers.map((teamMember) => {
    const [memberX, memberY] = teamMember.geometry.coordinates

    if (memberX === 0 || memberY === 0) {
      return {
        ...teamMember,
        noCoords: true,
        homeAirportCode: null,
      }
    }
    // Cheap bbox filter first
    const airportsAround = airportsList.filter((airport) => {
      const [airportX, airportY] = airport.geometry.coordinates
      // Cheap distance
      return (
        memberX > airportX - 5 &&
        memberX < airportX + 5 &&
        memberY > airportY - 5 &&
        memberY < airportY + 5
      )
    })

    // All airports at < 200km of member
    const nearestAirports = airportsAround
      .map((airport) => {
        return {
          ...airport,
          distance: getDistance(airport, teamMember),
        }
      })
      .filter((a) => a.distance < 200)
    nearestAirports.sort((a, b) => a.distance - b.distance)
    // If only 1 large airport within 200km, pick it. Otherwise use closest
    const nearbyLargeAirport = nearestAirports.filter(
      (a) => a.properties.type === 'large_airport'
    )
    const homeAirport =
      nearbyLargeAirport.length === 1
        ? nearbyLargeAirport[0]
        : nearestAirports[0]

    return {
      ...teamMember,
      noCoords: false,
      homeAirportCode: homeAirport?.properties.iata_code,
    }
  })

  // Computer goes brr
  const results = airportsList.flatMap((airport) => {
    // Get relationship of this airport with every member
    const airportTeamMembers = teamMembersList.map((teamMember) => {
      // Multiply by two for round trip
      const distance = teamMember.noCoords
        ? null
        : getDistance(airport, teamMember) * 2
      const co2 = distance === null ? null : getCO2(distance)
      return {
        ...teamMember,
        distance,
        co2,
      }
    })

    // Eliminate airport if its close and not anyone's home airport
    // const teamMembersCloseToAirport = airportTeamMembers.filter(
    //   (teamMember) => !teamMember.distance || teamMember.distance < 200
    // )
    const homeAirportCount = airportTeamMembers.filter(
      (teamMember) =>
        teamMember.homeAirportCode === airport.properties.iata_code
    ).length

    // if (airportTeamMembers.length && !homeAirportCount) return []

    const totalKm = airportTeamMembers.reduce(
      (agg, teamMember) =>
        agg + (teamMember.distance ? teamMember.distance : 0),
      0
    )
    const totalCO2 = airportTeamMembers.reduce(
      (agg, teamMember) => agg + (teamMember.co2 ? teamMember.co2 : 0),
      0
    )
    return [
      {
        ...airport,
        properties: {
          ...airport.properties,
          airportTeamMembers,
          totalKm,
          totalCO2,
          homeAirportCount,
        },
      },
    ]
  })
  
  // Do not show local airports that are not home airports
  // TODO make it configurable
  let finalResults = results.filter(
    (airport) =>
      airport.properties.homeAirportCount ||
      airport.properties.type === 'large_airport'
  )
  finalResults.sort((a, b) => a.properties.totalCO2 - b.properties.totalCO2)


  const homeAirports = finalResults.filter(
    (airport) => airport.properties.homeAirportCount
    )

  const nonHomeAirports = finalResults.filter(
    (airport) => !airport.properties.homeAirportCount
    )

  const slicedResults = []
  if (alwaysIncludeHomeAirports) {
    slicedResults.push(...homeAirports.slice(0, maxResults))  
  }

  slicedResults.push(...nonHomeAirports.slice(0, maxResults - slicedResults.length))
  slicedResults.sort((a, b) => a.properties.totalCO2 - b.properties.totalCO2)

  const withScores = getScores(slicedResults)

  return withScores
}

export function getGreatCircles(result: Feature<Point, Result>) {
  return result.properties.airportTeamMembers
    .filter((atm) => atm.distance !== null)
    .map((atm) => {
      return greatCircle(result.geometry.coordinates, atm.geometry.coordinates)
    })
}
export function formatCO2(co2: number) {
  return [(co2 / 1000).toFixed(2), 't CO₂'].join('')
}


// If value is > maxAbsoluteCO2, this bucket will be skipped when doing kmeans
const DEFAULT_SCORE_BREAKS = [
  { maxAbsoluteCO2: 10000 },
  { maxAbsoluteCO2: 20000 },
  { maxAbsoluteCO2: 30000 },
  {},
  {}
]

export function getScores(results: Feature<Point, Result>[], breaks = DEFAULT_SCORE_BREAKS) {
  const bestValue = results[0].properties.totalCO2

  let startBreaksAt = 0
  for (let i = 0; i < breaks.length; i++) {
    if (bestValue < breaks[i].maxAbsoluteCO2 ||  breaks[i].maxAbsoluteCO2 === undefined) {
      startBreaksAt = i
      break
    }
  }

  const totalBreaks = breaks.length - startBreaksAt
  
  const allCO2s = results.map(
    (r) => r.properties.totalCO2
  )

  const clusters = ckmeans(allCO2s, totalBreaks)

  const resultsWithScores = results.map((r) => {
    const score = clusters.findIndex((c) => c.includes(r.properties.totalCO2)) + startBreaksAt
    return {
      ...r,
      properties: {
        ...r.properties,
        score,
      },
    }
  })

  return resultsWithScores
 
}