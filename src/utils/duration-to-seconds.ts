/**
 * Parses a duration string into seconds.
 * Supports units: s, m, h, d, w, M, y, ms.
 */
export const parseDurationToSeconds = (duration: string): number => {
  if (typeof duration === 'number') {
    return duration
  }

  const matches = duration.match(/^(\d+)([smhdwMy]|ms)$/)

  if (!matches) {
    throw new Error(`Invalid duration format: ${duration}`)
  }

  const value = parseInt(matches[1], 10)
  const unit = matches[2] as TimeUnit

  switch (unit) {
    case 's':
      return value
    case 'm':
      return value * 60
    case 'h':
      return value * 60 * 60
    case 'd':
      return value * 24 * 60 * 60
    case 'w':
      return value * 7 * 24 * 60 * 60
    case 'M':
      return value * 30 * 24 * 60 * 60
    case 'y':
      return value * 365 * 24 * 60 * 60
    case 'ms':
      return Math.floor(value / 1000)
    default:
      throw new Error(`Unsupported time unit: ${unit}`)
  }
}

// Type definition for allowed time units
type TimeUnit = 's' | 'm' | 'h' | 'd' | 'w' | 'M' | 'y' | 'ms'
