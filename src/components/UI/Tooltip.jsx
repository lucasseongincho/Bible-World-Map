import useMapStore from '../../store/useMapStore'
import { getCategoryColor } from '../../utils/colorMap'

const CATEGORY_LABELS = {
  'creation':    'Creation',
  'covenant':    'Covenant',
  'battle':      'Battle',
  'miracle':     'Miracle',
  'prophecy':    'Prophecy',
  'journey':     'Journey',
  'birth-death': 'Birth / Death',
  'worship':     'Worship',
  'judgment':    'Judgment',
  'gospel':      'Gospel',
  'apostolic':   'Apostolic',
  'early-church':'Early Church',
}

export default function Tooltip() {
  const { hoveredEvent, tooltipPosition } = useMapStore()
  if (!hoveredEvent) return null

  const color = getCategoryColor(hoveredEvent.category)

  // Clamp so tooltip never goes off-screen
  const TOOLTIP_W = 236
  const TOOLTIP_H = 110
  const rawLeft = tooltipPosition.x + 18
  const rawTop  = tooltipPosition.y - 58
  const left = Math.min(rawLeft, window.innerWidth  - TOOLTIP_W - 8)
  const top  = Math.max(8,       Math.min(rawTop, window.innerHeight - TOOLTIP_H - 8))

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 1200,
        pointerEvents: 'none',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div style={{
        background: 'rgba(5,8,15,0.96)',
        border: `1px solid ${color}50`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 8,
        padding: '10px 14px',
        maxWidth: 220,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), 0 0 12px ${color}20`,
        backdropFilter: 'blur(16px)',
      }}>
        {/* Category chip */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 5,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 4px ${color}` }} />
          <span style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 8.5, letterSpacing: '0.16em',
            color, textTransform: 'uppercase',
          }}>
            {CATEGORY_LABELS[hoveredEvent.category] || hoveredEvent.category}
          </span>
        </div>
        {/* Title */}
        <div style={{
          fontFamily: 'Cinzel, serif',
          fontSize: 13, fontWeight: 600, lineHeight: 1.3,
          color: 'var(--ivory)', marginBottom: 5,
        }}>
          {hoveredEvent.title}
        </div>
        {/* Reference */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-body)' }}>
            {hoveredEvent.reference.book} {hoveredEvent.reference.chapter}:{hoveredEvent.reference.verse_start}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {hoveredEvent.date_label}
          </span>
        </div>
        {/* Click hint */}
        <div style={{
          marginTop: 7,
          paddingTop: 6,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: 10, color: 'var(--text-muted)',
          fontStyle: 'italic',
        }}>
          Click to explore →
        </div>
      </div>
    </div>
  )
}
