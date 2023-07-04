import { Feature, featureCollection } from "@turf/helpers";
import { Point } from "geojson";
import { Result, getGreatCircles } from "./getOnsiteLocations";
import style from './maplibre-style.json'
import { useMemo } from "react";

export default function useMapStyle(currentResult: Feature<Point, Result>, results: Feature<Point, Result>[]) {

  const currentStyle = useMemo(() => {
    const newStyle = { ...style }
    if (!currentResult) return newStyle

    const greatCircles = featureCollection(getGreatCircles(currentResult))

    const sources = {
      ...newStyle.sources,
      greatCircles: {
        type: 'geojson',
        data: greatCircles
      }
    }

    const layers = [
      ...newStyle.layers,
      {
        id: 'greatCircles',
        type: 'line',
        source: 'greatCircles',
        paint: {
          'line-color': '#f00',
          'line-width': 2
        }
      }
    ]

    return {
      ...newStyle,
      sources,
      layers
    }

  }, [currentResult])

  return currentStyle
}