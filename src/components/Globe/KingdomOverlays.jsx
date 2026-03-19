import { Polygon, Tooltip } from 'react-leaflet'
import kingdoms from '../../data/kingdoms.json'

export default function KingdomOverlays({ timelinePosition }) {
  return kingdoms.features.map(feature => {
    const props  = feature.properties
    const coords = feature.geometry.coordinates[0]

    const visible = timelinePosition === null
      || (timelinePosition >= props.period_start && timelinePosition <= props.period_end)

    if (!visible) return null

    // Convert [lng, lat] → [lat, lng] for Leaflet
    const positions = coords.map(([lng, lat]) => [lat, lng])

    return (
      <Polygon
        key={props.id}
        positions={positions}
        pathOptions={{
          color:       props.color,
          fillColor:   props.color,
          fillOpacity: 0.16,
          weight:      1.8,
          opacity:     0.6,
          dashArray:   '4 3',
        }}
      >
        <Tooltip
          sticky={false}
          permanent={false}
          direction="center"
          className="kingdom-tooltip"
        >
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 12, color: props.color }}>
            {props.name}
          </span>
          <br />
          <span style={{ fontSize: 11, color: '#8a9ab0' }}>{props.period}</span>
        </Tooltip>
      </Polygon>
    )
  })
}
