import { createRoot } from 'react-dom/client'
import maplibregl, { Map } from 'maplibre-gl'
import style from '../style/maplibre-style.json'
import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Popup from './Popup'
import useMapStyle, { AIRPORT_ICON_LAYER_ID, AIRPORT_LAYER_ID } from '../hooks/useMapStyle'
import {
  currentResultAtom,
  customTeamMembersAtom,
  resultsAtom,
  selectedAirportCodeAtom,
  selectedTeamMembersAtom,
} from './atoms.ts'
import { useAtom, useAtomValue } from 'jotai'

const CandidatesMapSection = styled.div`
  height: 100%;
  flex: 0 0 40vw;
`

export default function MapWrapper({}: any) {
  const mapContainer = useRef()
  const mapRef = useRef<Map>()
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedAirportCode, setSelectedAirportCode] = useAtom(selectedAirportCodeAtom)
  const [currentlyAddedMember, setCurrentlyAddedMember] = useState(null)
  const currentResult = useAtomValue(currentResultAtom)
  const results = useAtomValue(resultsAtom)
  const [selectedTeamMembers, setSelectedTeamMembers] = useAtom(
    selectedTeamMembersAtom
  )
  const [customTeamMembers, setCustomTeamMembers] = useAtom(
    customTeamMembersAtom
  )

  const currentStyle = useMapStyle(currentResult, results, selectedTeamMembers)

  useEffect(() => {
    const mbMap = mapRef.current
    if (mapLoaded && mbMap) {
      mbMap.setStyle(currentStyle)
    }
  }, [mapLoaded, currentStyle])

  const addMember = useCallback(
    (name: string) => {
      setCurrentlyAddedMember(null)
      const newTeamMember = {
        ...currentlyAddedMember,
        properties: {
          name,
        },
      }
      popupRef.current.remove()
      setCustomTeamMembers([...customTeamMembers, newTeamMember])
      setSelectedTeamMembers([...selectedTeamMembers, newTeamMember])
    },
    [currentlyAddedMember]
  )

  useEffect(() => {
    const mbMap = new maplibregl.Map({
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
      const airport = features.find((f) => [AIRPORT_ICON_LAYER_ID, AIRPORT_LAYER_ID].includes(f.layer.id))
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
  }, [setCurrentlyAddedMember])

  useEffect(() => {
    const mbMap = mapRef.current
    if (mapLoaded && mbMap && currentlyAddedMember) {
      if (!popupRef.current) {
        popupRef.current = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: false,
        })
      }

      const popupNode = document.createElement('div')
      const root = createRoot(popupNode); 
      root.render(<Popup onSubmit={addMember} />);

      popupRef.current
        .setLngLat(currentlyAddedMember?.geometry.coordinates)
        .setDOMContent(popupNode)
      popupRef.current.addTo(mbMap)
    }
  }, [mapLoaded, currentlyAddedMember])

  const popupRef = useRef<maplibregl.Popup>()

  return <CandidatesMapSection ref={mapContainer} />
}
