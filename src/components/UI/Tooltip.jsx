import useMapStore from '../../store/useMapStore'
import { getCategoryColor } from '../../utils/colorMap'

export default function Tooltip() {
  const { hoveredEvent, tooltipPosition } = useMapStore()

  if (!hoveredEvent) return null

  const color = getCategoryColor(hoveredEvent.category)

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: tooltipPosition.x + 16,
        top: tooltipPosition.y - 40,
      }}
    >
      <div
        className="bg-gray-900/95 backdrop-blur border rounded-lg px-3 py-2 shadow-xl max-w-xs"
        style={{ borderColor: color + '60' }}
      >
        <div className="font-cinzel text-sm font-semibold" style={{ color }}>
          {hoveredEvent.title}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {hoveredEvent.reference.book} {hoveredEvent.reference.chapter}:{hoveredEvent.reference.verse_start}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{hoveredEvent.date_label}</div>
      </div>
    </div>
  )
}
