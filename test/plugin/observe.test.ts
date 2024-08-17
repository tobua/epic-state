import '../setup-dom'
import { expect, mock, test } from 'bun:test'
import { batch, observe, state } from '../../index'
import { PluginAction } from '../../types'

global.stateDisableBatching = false

test('Can observe changes to any state object.', () => {
  const callbackMock = mock()
  const firstRoot = state({ count: 1 })
  const secondRoot = state({ count: 2 })

  const observations = observe(callbackMock)

  firstRoot.count = 2
  secondRoot.count = 3

  expect(callbackMock).not.toHaveBeenCalled()
  expect(observations.length).toBe(0)

  batch()

  expect(firstRoot.count).toBe(2)
  expect(secondRoot.count).toBe(3)

  batch()

  expect(callbackMock.mock.calls.length).toBe(4)
  expect(observations.length).toBe(4)

  expect(callbackMock.mock.calls[0][0]).toEqual(observations[0])
  expect(observations[1][0]).toBe(PluginAction.Set)
  expect(observations[1][2]).toBe('count')
  expect(observations[1][3]).toBe(2)

  expect(observations[3][0]).toBe(PluginAction.Get)
  expect(observations[3][2]).toBe('count')
  expect(observations[3][3]).toBe(3)
})

test("Nested general observations don't lead to multiple notifications.", () => {
  const firstRoot = state({ count: 1, nested: { count: 3 } })
  const secondRoot = state({ count: 2, nested: { count: 4 } })

  const observations = observe()

  firstRoot.count = 2
  firstRoot.count = 3
  secondRoot.count = 3
  secondRoot.count = 4
  firstRoot.nested.count = 4
  firstRoot.nested.count = 5
  secondRoot.nested.count = 5
  secondRoot.nested.count = 6

  batch()

  expect(firstRoot.count).toBe(3)
  expect(secondRoot.count).toBe(4)
  expect(firstRoot.nested.count).toBe(5)
  expect(secondRoot.nested.count).toBe(6)

  expect(observations.length).toBe(8)
})

// TODO plugins can disable batching.
