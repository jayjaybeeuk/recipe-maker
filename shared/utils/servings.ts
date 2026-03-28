/**
 * Scales a recipe ingredient quantity by a factor and returns a display string.
 * Returns null passthrough as empty string.
 * Formats results to avoid ugly decimals:
 *   - Integer results → whole number string ("2", "3")
 *   - Exact halves → "½"
 *   - Exact quarters → "¼"
 *   - Exact three-quarters → "¾"
 *   - Otherwise → one decimal place, trailing zero stripped ("1.5", "0.3")
 */
export function scaleQuantity(quantity: number | null, factor: number): string {
  if (quantity === null || factor === 0) return ''

  const scaled = quantity * factor

  if (Math.round(scaled) === scaled) return String(Math.round(scaled))
  if (Math.abs(scaled - Math.round(scaled) + 0.5) < 0.01) return '½'
  if (Math.abs(scaled - Math.round(scaled) + 0.75) < 0.01) return '¼'
  if (Math.abs(scaled - Math.round(scaled) + 0.25) < 0.01) return '¾'

  return scaled.toFixed(1).replace(/\.0$/, '')
}

/**
 * Formats a duration in seconds to a MM:SS display string.
 * e.g. 90 → "1:30", 65 → "1:05"
 */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
