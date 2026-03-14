import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import { useCesium } from 'resium'
import kingdoms from '../../data/kingdoms.json'

function KingdomOverlaysInner({ timelinePosition }) {
  const { viewer } = useCesium()
  const entityMapRef = useRef({})   // regionId -> polygon entity
  const outlineMapRef = useRef({})  // regionId -> polyline entity (B3: replaces polygon outline)
  const labelMapRef = useRef({})

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return

    kingdoms.features.forEach(feature => {
      const props = feature.properties
      const coords = feature.geometry.coordinates[0]

      // Determine visibility based on timeline position
      const visible = timelinePosition === null
        || (timelinePosition >= props.period_start && timelinePosition <= props.period_end)

      const positions = coords.map(([lng, lat]) =>
        Cesium.Cartesian3.fromDegrees(lng, lat)
      )

      const fillColor = Cesium.Color.fromCssColorString(props.color).withAlpha(visible ? 0.18 : 0.0)
      const outlineColor = Cesium.Color.fromCssColorString(props.color).withAlpha(visible ? 0.55 : 0.0)

      if (entityMapRef.current[props.id]) {
        // Update existing polygon fill
        const ent = entityMapRef.current[props.id]
        ent.polygon.material = new Cesium.ColorMaterialProperty(fillColor)
        // Update companion polyline outline (B3)
        if (outlineMapRef.current[props.id]) {
          outlineMapRef.current[props.id].polyline.material =
            new Cesium.ColorMaterialProperty(outlineColor)
          outlineMapRef.current[props.id].polyline.show =
            new Cesium.ConstantProperty(visible)
        }
        if (labelMapRef.current[props.id]) {
          labelMapRef.current[props.id].label.show = new Cesium.ConstantProperty(visible)
        }
      } else {
        // Compute centroid for label placement
        const centroid = positions.reduce(
          (acc, p) => {
            acc.x += p.x; acc.y += p.y; acc.z += p.z
            return acc
          },
          { x: 0, y: 0, z: 0 }
        )
        const n = positions.length
        const centroidCart = new Cesium.Cartesian3(centroid.x / n, centroid.y / n, centroid.z / n)

        // Polygon fill — no outline property (broken on WebGL2)
        const ent = viewer.entities.add({
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(positions),
            material: new Cesium.ColorMaterialProperty(fillColor),
            height: 0,
            fill: true,
          },
        })
        entityMapRef.current[props.id] = ent

        // B3: Companion polyline for border (closes the loop by repeating first point)
        const loopPositions = [...positions, positions[0]]
        const outlineEnt = viewer.entities.add({
          polyline: {
            positions: loopPositions,
            width: 1.5,
            material: new Cesium.ColorMaterialProperty(outlineColor),
            clampToGround: false,
            arcType: Cesium.ArcType.NONE,
            show: visible,
          },
        })
        outlineMapRef.current[props.id] = outlineEnt

        const labelEnt = viewer.entities.add({
          position: centroidCart,
          label: {
            text: props.name,
            font: '12px "Cinzel", serif',
            fillColor: Cesium.Color.fromCssColorString(props.color),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            translucencyByDistance: new Cesium.NearFarScalar(2e6, 1.0, 1e7, 0.0),
            show: visible,
          },
        })
        labelMapRef.current[props.id] = labelEnt
      }
    })
  }, [viewer, timelinePosition])

  useEffect(() => {
    return () => {
      if (viewer && !viewer.isDestroyed()) {
        Object.values(entityMapRef.current).forEach(e => viewer.entities.remove(e))
        Object.values(outlineMapRef.current).forEach(e => viewer.entities.remove(e))
        Object.values(labelMapRef.current).forEach(e => viewer.entities.remove(e))
      }
      entityMapRef.current = {}
      outlineMapRef.current = {}
      labelMapRef.current = {}
    }
  }, [viewer])

  return null
}

export default function KingdomOverlays({ timelinePosition }) {
  return <KingdomOverlaysInner timelinePosition={timelinePosition} />
}
