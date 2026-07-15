import type { MaskStyle } from './types'

/**
 * The reference prototype's look: shared warm amber, soft translucent fill, a
 * thin top line and a solid-ish baseline. `floorLift` 0.38 is the reference's
 * low-tone floor. These are the defaults `createMask` starts from.
 */
export const defaultStyle: MaskStyle = {
  color: '#C6851C',
  fillOpacity: 0.16,
  topWidth: 1.5,
  topOpacity: 0.45,
  bottomWidth: 2.5,
  bottomOpacity: 0.85,
  floorLift: 0.38,
  softGap: 1,
  hardGap: 2,
  smoothing: 1,
}
