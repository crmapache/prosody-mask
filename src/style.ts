import type { MaskStyle } from './types'

/**
 * The default look: a shared blue, soft translucent fill, a thin top line and a
 * solid-ish baseline. `floorLift` 0.38 keeps low tones off the floor. Pause gaps
 * are in spaces. These are the defaults `createMask` starts from.
 */
export const defaultStyle: MaskStyle = {
  color: '#1C92C4',
  fillOpacity: 0.16,
  topWidth: 1.5,
  topOpacity: 0.45,
  bottomWidth: 2.5,
  bottomOpacity: 0.85,
  floorLift: 0.38,
  softGap: 2,
  hardGap: 4,
  smoothing: 1,
}
