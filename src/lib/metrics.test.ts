import { describe, expect, it } from 'vitest'
import { formatMetric } from './metrics'

describe('formatMetric duration', () => {
  it('formats seconds as human-readable elapsed time', () => {
    expect(formatMetric(42, 'duration')).toBe('42s')
    expect(formatMetric(594.2, 'duration')).toBe('9m 54s')
    expect(formatMetric(800.5, 'duration')).toBe('13m 21s')
    expect(formatMetric(4320, 'duration')).toBe('1h 12m')
  })
})
