export const CATEGORY_COLORS = {
  'creation': '#8B5CF6',
  'covenant': '#F59E0B',
  'battle': '#EF4444',
  'miracle': '#3B82F6',
  'prophecy': '#10B981',
  'journey': '#F97316',
  'birth-death': '#EC4899',
  'worship': '#6366F1',
  'judgment': '#DC2626',
  'gospel': '#FBBF24',
  'apostolic': '#22D3EE',
  'early-church': '#A78BFA',
}

export const getCategoryColor = (category) => CATEGORY_COLORS[category] || '#FFFFFF'

export const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
