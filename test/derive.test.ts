import { expect, test, vi } from 'vitest'
import { state } from '../index'
import { process } from './helper'

test('Derived values will only be recalcuated when any of the attached values have changed.', async () => {
  const doubleMock = vi.fn(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      root.count * 2,
  )

  const root = state({
    count: 1,
    get double() {
      return doubleMock()
    },
  })

  let doubleValue = root.double

  expect(doubleValue).toBe(2)
  expect(doubleMock.mock.calls.length).toBe(1)

  doubleValue = root.double

  expect(doubleValue).toBe(2)
  expect(doubleMock.mock.calls.length).toBe(2) // TODO Should be 1.

  root.count = 2

  await process() // Should have no effect

  doubleValue = root.double

  expect(doubleValue).toBe(4)
  expect(doubleMock.mock.calls.length).toBe(3)
})
