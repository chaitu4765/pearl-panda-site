// node --experimental-strip-types scripts/test-hero-transfer.mjs
import assert from 'node:assert/strict'
import { heroTransfer } from '../src/lib/hero-transfer.ts'

let checks = 0
for (let index = 0; index <= 1000; index++) {
  const progress = index / 1000
  const state = heroTransfer(progress, true)
  assert(state.atoms >= 0 && state.atoms <= 1)
  assert(state.position >= 0 && state.position <= 1)
  if (progress <= .22) assert.equal(state.position, 0, 'Dissolve before departing')
  if (progress >= .78) {
    assert.equal(state.position, 1, 'Arrive before reassembling')
    assert.equal(state.atoms, 0, 'Arrival immediately triggers reconstruction without more scroll')
  }
  if (state.position > 0 && state.position < 1) assert.equal(state.atoms, 1, 'Only atoms may cross the page')
  const reverse = heroTransfer(1 - progress, true, -1)
  assert(Math.abs(state.atoms - reverse.atoms) < 1e-10, 'Symmetric reversible dissolve')
  assert(Math.abs(state.position - (1 - reverse.position)) < 1e-10, 'Symmetric reversible travel')
  assert.equal(heroTransfer(progress, false).atoms, 0, 'Same-side pose changes stay solid')
  checks++
}
assert.deepEqual(heroTransfer(0, true), { position: 0, atoms: 0, phase: 'solid' })
assert.deepEqual(heroTransfer(1, true), { position: 1, atoms: 0, phase: 'solid' })
console.log(`Passed ${checks} timeline samples: dissolve, cross, rebuild and reverse.`)
