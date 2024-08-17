import { expect, test } from 'bun:test'
import { batch, observe, state } from '../index'
import { PluginAction } from '../types'

global.stateDisableBatching = true

test('Methods added to the state will not be tracked or converted to a proxy.', () => {
  const root = state({
    count: 1,
    increment: () => {
      root.count += 1
    },
  })

  // @ts-expect-error
  expect(root.increment.parent).toBeUndefined()
  // @ts-expect-error
  expect(root.increment.root).toBeUndefined()

  const observations = observe() // TODO observe only root!

  expect(root.count).toBe(1) // First 'get'

  root.increment() // Second 'get', first 'set'

  expect(root.count).toBe(2) // Third 'get'

  batch()

  expect(observations.length).toBe(4)
  expect(observations[2][0]).toBe(PluginAction.Set)
})

test('Actions can be nested.', async () => {
  const root = state({
    count: 1,
    nested: {
      count: 2,
      increment: () => {
        root.nested.count += 1
      },
    },
  })

  // @ts-expect-error
  expect(root.nested.increment.parent).toBeUndefined()
  // @ts-expect-error
  expect(root.nested.increment.root).toBeUndefined()

  expect(root.count).toBe(1)
  expect(root.nested.count).toBe(2)

  root.nested.increment()
  root.nested.increment()

  expect(root.count).toBe(1)
  expect(root.nested.count).toBe(4)
})
