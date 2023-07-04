import { render } from 'react-dom'
import maplibregl, { Map } from 'maplibre-gl'
import style from './maplibre-style.json'
import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Popup from './Popup'
import useMapStyle from './useMapStyle'
import { currentResultAtom, customTeamMembersAtom, resultsAtom, selectedTeamMembersAtom } from './atoms.ts'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'

const CandidatesMapSection = styled.div`
  min-height: 20rem;
  flex: 0 0 40vw;
`

export default function MapWrapper({}: any) {
  const mapContainer = useRef()
  const mapRef = useRef<Map>()
  const [mapLoaded, setMapLoaded] = useState(false)
  const [currentlyAddedMember, setCurrentlyAddedMember] = useState(null)
  const currentResult = useAtomValue(currentResultAtom)
  const results = useAtomValue(resultsAtom)
  const [selectedTeamMembers, setSelectedTeamMembers] = useAtom(selectedTeamMembersAtom)
  const [customTeamMembers, setCustomTeamMembers] = useAtom(customTeamMembersAtom)

  const currentStyle = useMapStyle(currentResult, results)

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
      setCustomTeamMembers([
        ...customTeamMembers,
        newTeamMember,
      ])
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
      render(<Popup onSubmit={addMember} />, popupNode)

      popupRef.current
        .setLngLat(currentlyAddedMember?.geometry.coordinates)
        .setDOMContent(popupNode)
      popupRef.current.addTo(mbMap)
    }
  }, [mapLoaded, currentlyAddedMember])

  const popupRef = useRef<maplibregl.Popup>()


  return <CandidatesMapSection ref={mapContainer} />
}
