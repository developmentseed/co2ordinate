import { useDropzone } from 'react-dropzone'
import { useCallback } from 'react'
import { parse } from 'papaparse'
import { Button } from '@devseed-ui/button'

export function Drop({ setCustomTeam }) {
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader()

      reader.onabort = () => console.log('file reading was aborted')
      reader.onerror = () => console.log('file reading has failed')
      reader.onload = () => {
        const rawText = reader.result
        const { data } = parse(rawText, { header: true })
        let firstRow = data[0]

        // Try to find geometry columns, either lat/lon or city/country
        let latCol = null
        let lonCol = null
        let cityCol = null
        let countryCol = null
        let teamCol = null
        let nameCol = null
        let features = []
        for (let col in firstRow) {
          if (col.toLowerCase().includes('lat')) {
            latCol = col
          }
          if (col.toLowerCase().includes('lon')) {
            lonCol = col
          }
          if (col.toLowerCase().includes('city')) {
            cityCol = col
          }
          if (col.toLowerCase().includes('country')) {
            countryCol = col
          }
          if (col.toLowerCase().includes('team')) {
            teamCol = col
          }
          if (col.toLowerCase().includes('name')) {
            nameCol = col
          }
        }

        // If we have lat/lon, use those
        if (latCol && lonCol) {
          features = data.map(function (row) {
            const lat = parseFloat(row[latCol])
            const lon = parseFloat(row[lonCol])
            const name = row[nameCol]
            const team = row[teamCol]
            return {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [lon, lat],
              },
              properties: {
                name,
                team,
              },
            }
          })
        } else if (cityCol && countryCol) {
          // Otherwise, use city/country
          features = data.map(function (row) {
            const city = row[cityCol]
            const country = row[countryCol]
            const name = row[nameCol]
            const team = row[teamCol]

            // TODO: Geocode city/country
            return {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [0, 0],
              },
              properties: {
                name,
                team,
                city,
                country,
              },
            }
          })
        } else {
          console.error('Could not find lat/lon or city/country columns')
        }
        if (features.length > 0) {
          setCustomTeam(features)
        }
      }
      reader.readAsText(file)
    })
  }, [])
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
  })

  return (
    <Button
      {...getRootProps({ className: 'dropzone' })}
      fitting="regular"
      radius="rounded"
      size="medium"
      variation="primary-fill"
    >
      Upload CSV (lat,lon, name)
      <input {...getInputProps()} />
    </Button>
  )
}
