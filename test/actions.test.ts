import { expect, mock, test } from 'bun:test'
import { observe, state } from '../index'
import { process } from './helper'

test('Methods added to the state will not be tracked or converted to a proxy.', async () => {
  const subscribeMock = mock()
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

  observe(subscribeMock, root)

  expect(root.count).toBe(1) // First 'get'

  root.increment() // Second 'get', first 'set'

  expect(root.count).toBe(2) // Third 'get'

  await process()

  expect(subscribeMock.mock.calls.length).toBe(1)
  expect(subscribeMock.mock.calls[0][0].length).toBe(4)
  expect(subscribeMock.mock.calls[0][0][2][0]).toBe('set')
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
