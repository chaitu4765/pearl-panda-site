const clamp = (value: number) => Math.max(0, Math.min(1, value))
export const easeHero = (value: number) => value < .5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2

/** Reversible scroll choreography: no lateral movement until the panda is atoms. */
export function heroTransfer(fraction: number, crossesPage: boolean, direction: 1 | -1 = 1) {
  const progress = clamp(fraction)
  if (!crossesPage) return { position: easeHero(progress), atoms: 0, phase: 'solid' }
  const departure = .22
  const arrival = .78
  const position = easeHero(clamp((progress - departure) / (arrival - departure)))
  const directedProgress = direction === 1 ? progress : 1 - progress
  // Arrival releases a timed settle in PandaScene; visitors need not keep scrolling
  // through a separate reconstruction runway to see the mascot again.
  const atoms = directedProgress < departure ? easeHero(directedProgress / departure)
    : directedProgress >= arrival ? 0 : 1
  const phase = progress === 0 || progress === 1 ? 'solid'
    : directedProgress < departure ? 'dissolving'
    : directedProgress >= arrival ? 'assembling' : 'travelling'
  return { position, atoms, phase }
}
