import { createRoot } from 'react-dom/client'
import mapbox, { Map } from 'mapbox-gl'
import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Popup from './Popup'
import useMapStyle, {
  AIRPORT_ICON_LAYER_ID,
  AIRPORT_LAYER_ID,
} from '../hooks/useMapStyle'
import {
  currentResultAtom,
  customTeamMembersAtom,
  resultsAtom,
  selectedAirportCodeAtom,
  selectedTeamMemberNamesAtom,
  selectedTeamMembersAtom,
} from './atoms.ts'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { BASE_STYLE_PATH } from '../constants'

const CandidatesMapSection = styled.div`
  height: 100%;
  flex: 0 0 40vw;
`

export default function MapWrapper({}: any) {
  const mapContainer = useRef()
  const mapRef = useRef<Map>()
  const [mapLoaded, setMapLoaded] = useState(false)
  const setSelectedAirportCode = useSetAtom(selectedAirportCodeAtom)
  const [currentlyAddedMember, setCurrentlyAddedMember] = useState(null)
  const currentResult = useAtomValue(currentResultAtom)
  const results = useAtomValue(resultsAtom)
  const selectedTeamMembers = useAtomValue(selectedTeamMembersAtom)
  const [selectedTeamMemberNames, setSelectedTeamMemberNames] = useAtom(
    selectedTeamMemberNamesAtom
  )
  const [customTeamMembers, setCustomTeamMembers] = useAtom(
    customTeamMembersAtom
  )

  const addMember = useCallback(
    (name: string, group: string | null) => {
      setCurrentlyAddedMember(null)
      const newTeamMember = {
        ...currentlyAddedMember,
        properties: {
          name,
          isCustom: true,
        },
      }
      if (group) {
        newTeamMember.properties.group = group
      }
      popupRef.current.remove()
      setCustomTeamMembers([...customTeamMembers, newTeamMember])
      setSelectedTeamMemberNames([...selectedTeamMemberNames, name])
    },
    [currentlyAddedMember]
  )

  const [style, setStyle] = useState(null)
  useEffect(() => {
    if (
      !process.env.MAPBOX_TOKEN ||
      !process.env.MAPBOX_USER ||
      !process.env.MAPBOX_STYLE_ID
    )
      return
    const styleUrl = `${BASE_STYLE_PATH}/${process.env.MAPBOX_USER}/${process.env.MAPBOX_STYLE_ID}?access_token=${process.env.MAPBOX_TOKEN}`
    fetch(styleUrl)
      .then((res) => res.json())
      .then((style) => {
        setStyle(style)
      })
  }, [])

  useEffect(() => {
    if (!style) return
    mapbox.accessToken = process.env.MAPBOX_TOKEN
    const mbMap = new mapbox.Map({
      container: mapContainer.current,
      style,
      logoPosition: 'bottom-left',
      pitchWithRotate: false,
      dragRotate: false,
      zoom: 0.25,
      maxZoom: 14,
    })

    mapRef.current = mbMap

    const getAirportAtCursor = (e) => {
      const features = mbMap.queryRenderedFeatures(e.point)
      const airport = features.find((f) =>
        [AIRPORT_ICON_LAYER_ID, AIRPORT_LAYER_ID].includes(f.layer.id)
      )
      return airport
    }

    mbMap.on('click', (e) => {
      const airport = getAirportAtCursor(e)
      if (airport) {
        setSelectedAirportCode(airport.properties.iata_code)
        return
      }

      const currentTeamMember = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [e.lngLat.lng, e.lngLat.lat],
        },
      }
      setCurrentlyAddedMember(currentTeamMember)
    })

    mbMap.on('mousemove', (e) => {
      const airport = getAirportAtCursor(e)
      if (airport) {
        mbMap.getCanvas().style.cursor = 'pointer'
        return
      }
      mbMap.getCanvas().style.cursor = 'crosshair'
    })

    mbMap.on('load', () => {
      mbMap.loadImage('./house.png', function (error, image) {
        if (error) throw error
        mbMap.addImage('house', image, {
          sdf: true,
        })
      })
      mbMap.loadImage('./user.png', function (error, image) {
        if (error) throw error
        mbMap.addImage('user', image, {
          sdf: true,
        })
      })
      setMapLoaded(true)
    })
  }, [setCurrentlyAddedMember, style])

  const currentStyle = useMapStyle(
    currentResult,
    results,
    selectedTeamMembers,
    style
  )

  useEffect(() => {
    const mbMap = mapRef.current
    if (mapLoaded && mbMap && currentStyle) {
      mbMap.setStyle(currentStyle)
    }
  }, [mapLoaded, currentStyle])

  useEffect(() => {
    const mbMap = mapRef.current
    if (mapLoaded && mbMap && currentlyAddedMember) {
      if (!popupRef.current) {
        popupRef.current = new mapbox.Popup({
          closeButton: true,
          closeOnClick: false,
        })
      }

      const popupNode = document.createElement('div')
      const root = createRoot(popupNode)
      root.render(<Popup onSubmit={addMember} />)

      popupRef.current
        .setLngLat(currentlyAddedMember?.geometry.coordinates)
        .setDOMContent(popupNode)
      popupRef.current.addTo(mbMap)
    }
  }, [mapLoaded, currentlyAddedMember])

  useEffect(() => {
    if (!selectedTeamMembers || selectedTeamMembers.length < 2) return
    const mbMap = mapRef.current

    const bbox = selectedTeamMembers.reduce(
      (acc, member) => {
        const [lon, lat] = member.geometry.coordinates
        return [
          Math.min(acc[0], lon),
          Math.min(acc[1], lat),
          Math.max(acc[2], lon),
          Math.max(acc[3], lat),
        ]
      },
      [Infinity, Infinity, -Infinity, -Infinity]
    )
    if (mapLoaded && mbMap) {
      try {
        mbMap.fitBounds(bbox as any, {
          padding: { top: 50, right: 50, bottom: 50, left: 550 },
        })
      } catch (e) {
        console.log(e)
        console.log(bbox)
      }
    }
  }, [mapLoaded, selectedTeamMembers])

  const popupRef = useRef<mapbox.Popup>()

  return <CandidatesMapSection ref={mapContainer} />
}
