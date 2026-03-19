import { useMemo } from 'react'
import { Polygon, CircleMarker, Tooltip } from 'react-leaflet'
import spreadData from '../../data/spread.json'

// Approximate polygon coordinates for each region [lng, lat] pairs
const REGION_POLYGONS = {
  'judea':           [[34.2,29.5],[36.0,29.5],[36.5,31.5],[35.8,33.3],[34.9,33.5],[34.2,32.5],[34.0,31.0],[34.2,29.5]],
  'syria':           [[35.5,33.0],[42.5,33.0],[42.5,37.5],[36.0,37.5],[35.0,35.5],[35.5,33.0]],
  'asia-minor-west': [[26.0,36.5],[31.0,36.0],[31.5,38.0],[30.0,40.0],[26.5,41.5],[25.5,40.0],[26.0,38.0],[26.0,36.5]],
  'asia-minor-east': [[31.0,36.0],[37.5,36.0],[38.5,37.5],[37.0,40.0],[34.0,42.0],[30.0,40.0],[31.5,38.0],[31.0,36.0]],
  'armenia':         [[38.0,38.5],[46.5,38.5],[47.0,41.5],[40.0,41.5],[37.5,40.0],[38.0,38.5]],
  'greece':          [[20.0,36.5],[26.5,36.5],[26.0,38.5],[22.0,41.5],[19.5,41.0],[20.0,38.5],[20.0,36.5]],
  'egypt':           [[25.0,22.0],[35.5,22.0],[35.5,30.5],[32.5,31.5],[29.5,31.0],[25.0,30.5],[25.0,22.0]],
  'rome-italy':      [[6.5,37.5],[15.5,37.5],[15.5,44.0],[12.5,47.0],[7.5,45.5],[6.5,43.5],[6.5,37.5]],
  'north-africa':    [[-5.0,30.0],[25.0,30.0],[25.0,34.0],[9.0,37.5],[0.0,36.5],[-5.0,35.5],[-5.0,30.0]],
  'persia':          [[44.0,25.0],[64.0,25.0],[64.0,38.5],[50.0,40.0],[44.0,38.0],[44.0,25.0]],
  'gaul':            [[-5.0,43.0],[8.5,43.0],[8.5,51.5],[2.5,51.5],[-5.0,49.5],[-5.0,43.0]],
  'spain':           [[-9.5,36.0],[3.5,36.0],[3.5,43.5],[-2.0,44.0],[-9.5,43.5],[-9.5,36.0]],
  'britain':         [[-6.5,50.0],[2.0,50.5],[2.0,53.5],[-2.0,59.0],[-6.5,58.0],[-6.5,50.0]],
  'arabia':          [[36.5,12.0],[58.0,12.0],[58.0,30.0],[50.0,30.0],[36.5,28.0],[36.5,12.0]],
  'ethiopia':        [[33.0,3.5],[44.0,3.5],[44.0,15.5],[38.0,16.0],[33.0,12.0],[33.0,3.5]],
  'germany':         [[6.0,47.5],[15.0,47.5],[15.0,54.5],[8.0,55.0],[6.0,53.0],[6.0,47.5]],
  'india-thomas':    [[72.0,8.0],[80.5,8.0],[80.5,15.0],[76.0,16.0],[72.0,13.0],[72.0,8.0]],
}

const SPREAD_COLOR = '#22d3a8'

function interpolate(snapA, snapB, t) {
  const aMap = {}
  snapA.regions.forEach(r => { aMap[r.id] = r.density })
  const result = { ...aMap }
  snapB.regions.forEach(r => {
    const a = aMap[r.id] ?? 0
    result[r.id] = a + (r.density - a) * Math.max(0, Math.min(1, t))
  })
  return result
}

export default function SpreadAnimation({ year }) {
  const { densities, churches } = useMemo(() => {
    let snapA = spreadData[0], snapB = spreadData[0]
    for (let i = 0; i < spreadData.length; i++) {
      if (spreadData[i].year <= year) {
        snapA = spreadData[i]
        snapB = spreadData[Math.min(i + 1, spreadData.length - 1)]
      }
    }
    const t = snapA.year === snapB.year ? 0 : (year - snapA.year) / (snapB.year - snapA.year)
    return { densities: interpolate(snapA, snapB, t), churches: snapA.churches }
  }, [year])

  return (
    <>
      {Object.entries(densities).map(([regionId, density]) => {
        const coords = REGION_POLYGONS[regionId]
        if (!coords || density < 0.02) return null
        // [lng,lat] → [lat,lng] for Leaflet
        const positions = coords.map(([lng, lat]) => [lat, lng])
        const fillOpacity   = Math.min(density * 0.45, 0.40)
        const strokeOpacity = Math.min(density * 0.65, 0.55)

        return (
          <Polygon
            key={regionId}
            positions={positions}
            pathOptions={{
              color:       SPREAD_COLOR,
              fillColor:   SPREAD_COLOR,
              fillOpacity,
              weight:      1.5,
              opacity:     strokeOpacity,
            }}
          />
        )
      })}

      {churches.map((church, i) => (
        <CircleMarker
          key={`church-${i}`}
          center={[church.lat, church.lng]}
          radius={5}
          pathOptions={{
            color:       '#ffffff',
            fillColor:   '#22d3ee',
            fillOpacity: 0.9,
            weight:      1.5,
          }}
        >
          <Tooltip direction="top" offset={[0, -6]} className="church-tooltip">
            {church.city}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  )
}
