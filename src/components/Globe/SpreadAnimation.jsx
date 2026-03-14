import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import { useCesium } from 'resium'
import spreadData from '../../data/spread.json'

// Approximate polygon coordinates for each region ID
const REGION_POLYGONS = {
  'judea': [
    [34.2, 29.5], [36.0, 29.5], [36.5, 31.5], [35.8, 33.3],
    [34.9, 33.5], [34.2, 32.5], [34.0, 31.0], [34.2, 29.5],
  ],
  'syria': [
    [35.5, 33.0], [42.5, 33.0], [42.5, 37.5], [36.0, 37.5],
    [35.0, 35.5], [35.5, 33.0],
  ],
  'asia-minor-west': [
    [26.0, 36.5], [31.0, 36.0], [31.5, 38.0], [30.0, 40.0],
    [26.5, 41.5], [25.5, 40.0], [26.0, 38.0], [26.0, 36.5],
  ],
  'asia-minor-east': [
    [31.0, 36.0], [37.5, 36.0], [38.5, 37.5], [37.0, 40.0],
    [34.0, 42.0], [30.0, 40.0], [31.5, 38.0], [31.0, 36.0],
  ],
  'armenia': [
    [38.0, 38.5], [46.5, 38.5], [47.0, 41.5], [40.0, 41.5],
    [37.5, 40.0], [38.0, 38.5],
  ],
  'greece': [
    [20.0, 36.5], [26.5, 36.5], [26.0, 38.5], [22.0, 41.5],
    [19.5, 41.0], [20.0, 38.5], [20.0, 36.5],
  ],
  'egypt': [
    [25.0, 22.0], [35.5, 22.0], [35.5, 30.5], [32.5, 31.5],
    [29.5, 31.0], [25.0, 30.5], [25.0, 22.0],
  ],
  'rome-italy': [
    [6.5, 37.5], [15.5, 37.5], [15.5, 44.0], [12.5, 47.0],
    [7.5, 45.5], [6.5, 43.5], [6.5, 37.5],
  ],
  'north-africa': [
    [-5.0, 30.0], [25.0, 30.0], [25.0, 34.0], [9.0, 37.5],
    [0.0, 36.5], [-5.0, 35.5], [-5.0, 30.0],
  ],
  'persia': [
    [44.0, 25.0], [64.0, 25.0], [64.0, 38.5], [50.0, 40.0],
    [44.0, 38.0], [44.0, 25.0],
  ],
  'gaul': [
    [-5.0, 43.0], [8.5, 43.0], [8.5, 51.5], [2.5, 51.5],
    [-5.0, 49.5], [-5.0, 43.0],
  ],
  'spain': [
    [-9.5, 36.0], [3.5, 36.0], [3.5, 43.5], [-2.0, 44.0],
    [-9.5, 43.5], [-9.5, 36.0],
  ],
  'britain': [
    [-6.5, 50.0], [2.0, 50.5], [2.0, 53.5], [-2.0, 59.0],
    [-6.5, 58.0], [-6.5, 50.0],
  ],
  'arabia': [
    [36.5, 12.0], [58.0, 12.0], [58.0, 30.0], [50.0, 30.0],
    [36.5, 28.0], [36.5, 12.0],
  ],
  'ethiopia': [
    [33.0, 3.5], [44.0, 3.5], [44.0, 15.5], [38.0, 16.0],
    [33.0, 12.0], [33.0, 3.5],
  ],
  'germany': [
    [6.0, 47.5], [15.0, 47.5], [15.0, 54.5], [8.0, 55.0],
    [6.0, 53.0], [6.0, 47.5],
  ],
  'india-thomas': [
    [72.0, 8.0], [80.5, 8.0], [80.5, 15.0], [76.0, 16.0],
    [72.0, 13.0], [72.0, 8.0],
  ],
}

const SPREAD_COLOR = new Cesium.Color(0.13, 0.85, 0.53, 1.0) // emerald-ish

// Find the best snapshot for a given year (nearest ≤ year, or first if before all)
function getSnapshotForYear(year) {
  let best = spreadData[0]
  for (const snap of spreadData) {
    if (snap.year <= year) best = snap
    else break
  }
  return best
}

// Interpolate between two snapshots for smooth transitions
function interpolateSnapshots(snapA, snapB, t) {
  const regionMap = {}
  snapA.regions.forEach(r => { regionMap[r.id] = r.density })
  const result = {}
  // Build from snapA
  snapA.regions.forEach(r => { result[r.id] = r.density })
  // Interpolate with snapB regions
  snapB.regions.forEach(r => {
    const a = regionMap[r.id] ?? 0
    result[r.id] = a + (r.density - a) * t
  })
  return result
}

function SpreadAnimationInner({ year }) {
  const { viewer } = useCesium()
  const entityMapRef = useRef({})   // regionId -> polygon fill entity
  const outlineMapRef = useRef({})  // regionId -> polyline outline entity (B3)
  const churchDsRef = useRef(null)

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return

    // Find bracketing snapshots
    let snapA = spreadData[0]
    let snapB = spreadData[0]
    for (let i = 0; i < spreadData.length; i++) {
      if (spreadData[i].year <= year) {
        snapA = spreadData[i]
        snapB = spreadData[Math.min(i + 1, spreadData.length - 1)]
      }
    }

    const t = snapA.year === snapB.year
      ? 0
      : (year - snapA.year) / (snapB.year - snapA.year)

    const densities = interpolateSnapshots(snapA, snapB, Math.max(0, Math.min(1, t)))

    // Update or create region polygons
    Object.entries(densities).forEach(([regionId, density]) => {
      const coords = REGION_POLYGONS[regionId]
      if (!coords) return

      const positions = coords.map(([lng, lat]) =>
        Cesium.Cartesian3.fromDegrees(lng, lat)
      )

      const alpha = Math.min(density * 0.5, 0.45)
      const outlineAlpha = Math.min(density * 0.7, 0.6)
      const fillColor = SPREAD_COLOR.withAlpha(alpha)
      const outlineColor = SPREAD_COLOR.withAlpha(outlineAlpha)

      if (entityMapRef.current[regionId]) {
        // Update polygon fill color
        const ent = entityMapRef.current[regionId]
        ent.polygon.material = new Cesium.ColorMaterialProperty(fillColor)
        // Update companion polyline outline (B3)
        if (outlineMapRef.current[regionId]) {
          outlineMapRef.current[regionId].polyline.material =
            new Cesium.ColorMaterialProperty(outlineColor)
        }
      } else {
        // Polygon fill only — no outline prop (broken on WebGL2)
        const ent = viewer.entities.add({
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(positions),
            material: new Cesium.ColorMaterialProperty(fillColor),
            height: 0,
            fill: true,
          },
        })
        entityMapRef.current[regionId] = ent

        // B3: Companion polyline for border (close the loop)
        const loopPositions = [...positions, positions[0]]
        const outlineEnt = viewer.entities.add({
          polyline: {
            positions: loopPositions,
            width: 1.5,
            material: new Cesium.ColorMaterialProperty(outlineColor),
            clampToGround: false,
            arcType: Cesium.ArcType.NONE,
          },
        })
        outlineMapRef.current[regionId] = outlineEnt
      }
    })

    // Hide regions that are no longer in this snapshot
    Object.keys(entityMapRef.current).forEach(regionId => {
      if (densities[regionId] === undefined) {
        entityMapRef.current[regionId].polygon.material =
          new Cesium.ColorMaterialProperty(SPREAD_COLOR.withAlpha(0))
        if (outlineMapRef.current[regionId]) {
          outlineMapRef.current[regionId].polyline.material =
            new Cesium.ColorMaterialProperty(SPREAD_COLOR.withAlpha(0))
        }
      }
    })

    // Church markers: use the nearest snapshot's churches
    if (churchDsRef.current && !viewer.isDestroyed()) {
      viewer.dataSources.remove(churchDsRef.current, true)
    }
    const ds = new Cesium.CustomDataSource('churches')
    viewer.dataSources.add(ds)
    churchDsRef.current = ds

    snapA.churches.forEach(church => {
      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(church.lng, church.lat),
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromCssColorString('#22D3EE').withAlpha(0.9),
          outlineColor: Cesium.Color.WHITE.withAlpha(0.7),
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1e6, 1.2, 1e7, 0.5),
        },
        label: {
          text: church.city,
          font: '11px "Lato", sans-serif',
          fillColor: Cesium.Color.fromCssColorString('#A5F3FC'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -20),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          translucencyByDistance: new Cesium.NearFarScalar(1e6, 1.0, 6e6, 0.0),
        },
      })
    })
  }, [viewer, year])

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      if (viewer && !viewer.isDestroyed()) {
        Object.values(entityMapRef.current).forEach(e => viewer.entities.remove(e))
        Object.values(outlineMapRef.current).forEach(e => viewer.entities.remove(e))
        if (churchDsRef.current) {
          viewer.dataSources.remove(churchDsRef.current, true)
        }
      }
      entityMapRef.current = {}
      outlineMapRef.current = {}
      churchDsRef.current = null
    }
  }, [viewer])

  return null
}

export default function SpreadAnimation({ year }) {
  return <SpreadAnimationInner year={year} />
}
