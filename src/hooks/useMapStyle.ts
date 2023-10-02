import { Feature, featureCollection } from '@turf/helpers'
import { Point } from 'geojson'
import { Result, TeamMember, getGreatCircles, getScores } from '../lib/getOnsiteLocations'
import { useMemo } from 'react'
import { SCORES_RAMP } from '../constants'


export const AIRPORT_ICON_LAYER_ID = 'airports-icon-all'
export const AIRPORT_LAYER_ID = 'airports-bg-all'

const getBgAirportBackgroundLayer = (currentResult: Feature<Point, Result>) => {
  return {
    type: 'circle',
    source: 'results',
    "paint": {
      "circle-radius": ["case", ["==", ["get", "iata_code"], currentResult.properties.iata_code], 10, 8],
      "circle-color": [
       "step",
        ["get", "score"],
        SCORES_RAMP[0],
        1, SCORES_RAMP[1],
        2, SCORES_RAMP[2],
        3, SCORES_RAMP[3],
        4, SCORES_RAMP[4],
      ],
      "circle-stroke-color": ["case", ["==", ["get", "iata_code"], currentResult.properties.iata_code], "#666", "#fff"],
      "circle-stroke-width": 1,
    },
    layout: {
      "circle-sort-key": ["case", [">", ["get", "homeAirportCount"], 0], 1, 0],
    }
  }
}

export const getIconAirportLayer = (currentResult: Feature<Point, Result>) => {
  return {
    id: 'airports-home-icon',
    type: 'symbol',
    source: 'results',
    layout: {
      'icon-image': 'house',
      'icon-allow-overlap': true,
      'icon-size': ["case", [">", ["get", "homeAirportCount"], 0], 0.5, 0],
    },
    "paint": {
      "icon-color": ["case", ["==", ["get", "iata_code"], currentResult.properties.iata_code], "#666", "#fff"]
    }
  }
}

export default function useMapStyle(
  currentResult: Feature<Point, Result>,
  results: Feature<Point, Result>[],
  teamMembers: Feature<Point, TeamMember>[],
  baseStyle: any
) {

  const currentStyle = useMemo(() => {
    if (!baseStyle) return null
    const newStyle = { ...baseStyle }
    if (!currentResult) return baseStyle

    const greatCircles = featureCollection(getGreatCircles(currentResult))

    const sources = {
      ...newStyle.sources,
      greatCircles: {
        type: 'geojson',
        data: greatCircles,
      },
      results: {
        type: 'geojson',
        data: featureCollection(results),
      },
      teamMembers: {
        type: 'geojson',
        data: featureCollection(teamMembers),
      },
    }

    const layers = [
      ...newStyle.layers,
      {
        id: 'greatCircles',
        type: 'line',
        source: 'greatCircles',
        paint: {
          'line-color': '#ccc',
          'line-width': 1,
        },
      },
      {
        id: 'teamMembers',
        type: 'symbol',
        source: 'teamMembers',
        layout: {
          'icon-image': 'user',
          'icon-size': .8,
          'icon-allow-overlap': true,
        },
        minzoom: 3,
      },
      {
        ...getBgAirportBackgroundLayer(currentResult),
        id: AIRPORT_LAYER_ID,
        filter: ["!=", ["get", "iata_code"], currentResult.properties.iata_code],
      },
      {
        ...getIconAirportLayer(currentResult),
        id: AIRPORT_ICON_LAYER_ID,
        filter: ["!=", ["get", "iata_code"], currentResult.properties.iata_code],
      },
      {
        ...getBgAirportBackgroundLayer(currentResult),
        id: 'airports-bg-selected',
        filter: ["==", ["get", "iata_code"], currentResult.properties.iata_code],
      },
      {
        ...getIconAirportLayer(currentResult),
        id: 'airports-icon-selected',
        filter: ["==", ["get", "iata_code"], currentResult.properties.iata_code],
      },
    ]

    return {
      ...newStyle,
      sources,
      layers,
    }
  }, [currentResult])

  return currentStyle
}
