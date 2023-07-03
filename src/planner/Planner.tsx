import { Feature, Point } from 'geojson'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { render } from 'react-dom'
import Select from 'react-select'
import styled from 'styled-components'
import mapboxgl, { Map } from 'mapbox-gl'
import style from './mapbox-style.json'
import 'mapbox-gl/dist/mapbox-gl.css'
import getOnsiteLocations, { Result, formatCO2 } from './getOnsiteLocations'
import countryCodeEmoji from 'country-code-emoji'
import useMapStyle from './useMapStyle'
import Popup from './Popup'

type TeamMemberProps = {
  name: string
  team: string
}
type TeamMember = Feature<Point, TeamMemberProps>

type PlannerProps = {
  baseTeam: TeamMember[]
}

const THEME_COLOR = '#ff002c'

const Candidates = styled.div`
  display: flex;
  justify-content: center;
`

const CandidatesTableSection = styled.div`
  max-height: 0.5vh;
  min-height: 540px;
  flex: 1;
  overflow: scroll;
`
const CandidatesMapSection = styled.div`
  min-height: 20rem;
  flex: 0 0 40vw;
`
const Table = styled.table`
  width: 100%;
  tr > th {
    text-align: left;
  }
`
const ResultRow = styled.tr`
  cursor: pointer;
  background: ${({ selected }) => (selected ? THEME_COLOR : 'transparent')};
  color: ${({ selected }) => (selected ? 'white' : 'inherit')};
  :hover {
    background: #ddd;
  }
`

const TeamMembersSection = styled.div`
  max-width: 600px;
`
const TeamMembersRow = styled.tr`
  color: ${({ disabled }) => (disabled ? 'grey' : 'inherit')};
`

const Equivalent = styled.p`
  margin: 0.5rem 0 1rem;
`

const Footer = styled.div`
  margin-top: 2rem;
`

export function Planner({ baseTeam }: PlannerProps) {
  const [currentlyAddedMember, setCurrentlyAddedMember] = useState(null)
  const [customTeamMembers, setCustomTeamMembers] = useState([])
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([])

  const team = useMemo(() => {
    return [...baseTeam, ...customTeamMembers]
  }, [baseTeam, customTeamMembers])

  const addMember = useCallback(
    (name: string) => {
      setCurrentlyAddedMember(null)
      const newTeamMember = {
        ...currentlyAddedMember,
        properties: {
          name,
        },
      }
      setCustomTeamMembers([
        ...customTeamMembers,
        newTeamMember,
      ])
      popupRef.current.remove()
      setSelectedTeamMembers([...selectedTeamMembers, newTeamMember])
    },
    [currentlyAddedMember, selectedTeamMembers, customTeamMembers]
  )

  const selectEntries = useMemo(() => {
    if (!team?.length) return []
    const teams = team.reduce((acc: string[], t: TeamMember) => {
      if (!acc.includes(t.properties.team)) acc.push(t.properties.team)
      return acc
    }, [])
    if (!teams) return team
    return [
      { properties: { id: 'ALL', name: 'ALL TEAMS' } },
      ...teams.map((p) => ({
        properties: { id: p, type: 'team', name: `TEAM: ${p}` },
      })),
      ...team,
    ]
  }, [team])

  const onSelectTeamMembers = useCallback(
    (teamMembers) => {
      const populatedSelection = teamMembers.flatMap((teamMember) => {
        if (teamMember.properties.id === 'ALL') return [...team]
        else if (teamMember.properties.type === 'team') {
          return [
            ...team.filter(
              (t) => t.properties.team === teamMember.properties.id
            ),
          ]
        } else return [teamMember]
      })

      // remove duplicates
      const dedupSelection = []
      populatedSelection.forEach((teamMember) => {
        if (
          !dedupSelection.filter(
            (t) => t.properties.name === teamMember.properties.name
          ).length
        ) {
          dedupSelection.push(teamMember)
        }
      })

      setSelectedTeamMembers(dedupSelection)
    },
    [team]
  )

  const [airports, setAirports] = useState(null)
  useEffect(() => {
    fetch(
      'https://raw.githubusercontent.com/nerik/airports-streamlined/main/airports_large_medium.geojson'
    )
      .then((response) => response.json())
      .then((data) => {
        setAirports(data)
      })
  }, [])

  const results = useMemo(() => {
    if (!airports) return null

    return getOnsiteLocations(selectedTeamMembers, airports.features).slice(
      0,
      1000
    )
  }, [selectedTeamMembers, airports])

  const [selectedResult, setSelectedResult] = useState(null)

  // Set selected result the first time, once we have results
  useEffect(() => {
    if (!selectedResult && results?.length) {
      setSelectedResult(results[0].properties.iata_code)
    }
  }, [selectedResult, results])

  // Select first result every time results change
  useEffect(() => {
    if (results?.length) setSelectedResult(results[0].properties.iata_code)
  }, [results])

  const currentResult: Feature<Point, Result> = useMemo(() => {
    if (!selectedResult || !results) return null
    return results.find((r) => r.properties.iata_code === selectedResult)
  }, [results, selectedResult])

  const mapContainer = useRef()
  const mapRef = useRef<Map>()
  const [mapLoaded, setMapLoaded] = useState(false)
  useEffect(() => {
    const mbMap = new mapboxgl.Map({
      container: mapContainer.current,
      style,
      logoPosition: 'bottom-left',
      pitchWithRotate: false,
      dragRotate: false,
      zoom: 0.25,
      maxZoom: 14,
      accessToken: process.env.MAPBOX_TOKEN,
    })

    mapRef.current = mbMap

    mbMap.on('click', (e) => {
      const currentTeamMember = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [e.lngLat.lng, e.lngLat.lat],
        },
      }
      setCurrentlyAddedMember(currentTeamMember)
    })

    mbMap.on('load', () => setMapLoaded(true))
  }, [setCurrentlyAddedMember])

  const popupRef = useRef<mapboxgl.Popup>()

  useEffect(() => {
    const mbMap = mapRef.current
    if (mapLoaded && mbMap && currentlyAddedMember) {
      if (!popupRef.current) {
        popupRef.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
        })
      }

      const popupNode = document.createElement('div')
      render(<Popup onSubmit={addMember} />, popupNode)

      popupRef.current
        .setLngLat(currentlyAddedMember?.geometry.coordinates)
        .setDOMContent(popupNode)
      popupRef.current.addTo(mbMap)
    }
  }, [mapLoaded, currentlyAddedMember])

  const currentStyle = useMapStyle(currentResult)

  useEffect(() => {
    const mbMap = mapRef.current
    if (mapLoaded && mbMap) {
      mbMap.setStyle(currentStyle)
    }
  }, [mapLoaded, currentStyle])

  const equivalent = useMemo(() => {
    if (!currentResult) return null
    const formatCO2 = (currentResult, factor) =>
      (currentResult.properties.totalCO2 / factor).toFixed(2)
    return [
      [
        `🇮🇳 approx. ${formatCO2(currentResult, 1930)} 
    times what an average Indian citizen emits per year`,
        'https://ourworldindata.org/grapher/co-emissions-per-capita',
      ],
      [
        `🧊 equivalent to approx. ${formatCO2(
          currentResult,
          1000 / 3
        )}  square meters of Arctic sea ice loss`,
        'https://science.sciencemag.org/content/354/6313/747',
      ],
      [
        `🍔 equivalent to the emissions of approx. ${formatCO2(
          currentResult,
          1.8
        )} cheese burgers`,
        'https://www.sixdegreesnews.org/archives/10261/the-carbon-footprint-of-a-cheeseburger',
      ],
      [
        `🚗 equivalent to approx. ${formatCO2(
          currentResult,
          0.15
        )} kilometers travelled with a small car`,
        'https://ourworldindata.org/travel-carbon-footprint',
      ],
    ][Math.floor(Math.random() * 4)]
  }, [currentResult])

  return (
    <>
      <Select
        isMulti
        placeholder={
          selectEntries.length
            ? 'Select at least 2 team members...'
            : 'Loading...'
        }
        name="colors"
        options={selectEntries}
        className="basic-multi-select"
        classNamePrefix="select"
        getOptionLabel={(option) => option.properties.name}
        getOptionValue={(option) => option.properties.name}
        onChange={onSelectTeamMembers}
        value={selectedTeamMembers}
      />
      <Candidates>
        <CandidatesTableSection>
          {' '}
          {results?.length ? (
            <Table>
              <tbody>
                <tr>
                  <th>Name/IATA code</th>
                  <th>Country</th>
                  <th>Total CO₂</th>
                  <th>Total dist</th>
                  <th>Home?</th>
                </tr>
                {results?.map((result) => (
                  <ResultRow
                    key={result.properties.iata_code}
                    onClick={
                      () => setSelectedResult(result.properties.iata_code)
                      /* eslint-disable-next-line */
                    }
                    selected={result.properties.iata_code === selectedResult}
                  >
                    <td>
                      {result.properties.municipality} (
                      {result.properties.iata_code})
                    </td>
                    <td>
                      {result.properties.iso_country}{' '}
                      {countryCodeEmoji(result.properties.iso_country)}{' '}
                    </td>
                    <td>{formatCO2(result.properties.totalCO2)}</td>
                    <td>{Math.round(result.properties.totalKm)} km</td>
                    <td>
                      {result.properties.homeAirportCount
                        ? '🏡'.repeat(result.properties.homeAirportCount)
                        : ''}
                    </td>
                  </ResultRow>
                ))}
              </tbody>
            </Table>
          ) : (
            'Please select at least 2 team members to show results.'
          )}
        </CandidatesTableSection>
        <CandidatesMapSection ref={mapContainer} />
      </Candidates>
      {currentResult && (
        <TeamMembersSection>
          <h2>
            Travelling to {currentResult.properties.municipality}:{' '}
            {currentResult.properties.airportTeamMembers.length} people -{' '}
            {formatCO2(currentResult.properties.totalCO2)}
          </h2>
          {equivalent && (
            <Equivalent>
              {equivalent[0]} (<a href={equivalent[1]}>source</a>)
            </Equivalent>
          )}

          <Table>
            <tbody>
              <tr>
                <th>Name</th>
                <th>CO₂</th>
                <th>Total dist</th>
              </tr>
              {currentResult.properties.airportTeamMembers.map((atm) => (
                <TeamMembersRow
                  key={atm.properties.name}
                  disabled={atm.distance === null}
                  title={
                    atm.distance === null
                      ? 'Team member does not have coordinates'
                      : ''
                  }
                >
                  <td>{atm.properties.name}</td>
                  <td>{atm.co2 !== null ? formatCO2(atm.co2) : '-'}</td>
                  <td>
                    {atm.distance !== null ? Math.round(atm.distance) : '-'} km
                  </td>
                </TeamMembersRow>
              ))}
            </tbody>
          </Table>
          <Footer>
            ⚠️ Those numbers are estimates based on kg CO₂/km averages, which
            may be less accurate than the industry-standard based on other
            factors such as payload, carrier type, layovers, etc.
            <br />
            <a href="https://github.com/developmentseed/meet-and-greta">
              Discuss this prototype on the Github repo
            </a>
          </Footer>
        </TeamMembersSection>
      )}
    </>
  )
}
