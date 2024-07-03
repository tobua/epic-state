import { expect, mock, test } from 'bun:test'
import { observe, state } from '../index'
import { process } from './helper'

test('Can observe changes to any state object.', async () => {
  const subscribeMock = mock()
  const firstRoot = state({ count: 1 })
  const secondRoot = state({ count: 2 })

  observe(subscribeMock)

  firstRoot.count += 1
  secondRoot.count += 1

  expect(subscribeMock).not.toHaveBeenCalled()

  await process()

  expect(firstRoot.count).toBe(2)
  expect(secondRoot.count).toBe(3)

  expect(subscribeMock).toHaveBeenCalled()
  expect(subscribeMock.mock.calls.length).toBe(2)

  expect(subscribeMock.mock.calls[0][0].length).toBe(2)
  expect(subscribeMock.mock.calls[1][0].length).toBe(2)

  expect(subscribeMock.mock.calls[0][0][0][0]).toEqual('get')
  expect(subscribeMock.mock.calls[0][0][1][0]).toEqual('set')
  expect(subscribeMock.mock.calls[0][0][1][2]).toEqual(2)
  expect(subscribeMock.mock.calls[1][0][0][0]).toEqual('get')
  expect(subscribeMock.mock.calls[1][0][1][0]).toEqual('set')
  expect(subscribeMock.mock.calls[1][0][1][2]).toEqual(3)
})

test("Nested general observations don't lead to multiple notifications.", async () => {
  const subscribeMock = mock()
  const firstRoot = state({ count: 1, nested: { count: 3 } })
  const secondRoot = state({ count: 2, nested: { count: 4 } })

  observe(subscribeMock)

  firstRoot.count = 2
  secondRoot.count = 3
  firstRoot.nested.count = 4
  secondRoot.nested.count = 5

  await process()

  expect(firstRoot.count).toBe(2)
  expect(secondRoot.count).toBe(3)
  expect(firstRoot.nested.count).toBe(4)
  expect(secondRoot.nested.count).toBe(5)

  expect(subscribeMock.mock.calls.length).toBe(2)

  expect(subscribeMock.mock.calls[0][0].length).toBe(3)
  expect(subscribeMock.mock.calls[1][0].length).toBe(3)
})

test('NotifyInSync options does not require a process() call for events to be observed.', async () => {
  const subscribeMock = mock()
  const root = state({ count: 1 })

  observe(subscribeMock, undefined, true)

  root.count += 1

  expect(subscribeMock).toHaveBeenCalled()
  expect(subscribeMock.mock.calls.length).toBe(2)

  await process() // Has no effect with this option.

  expect(subscribeMock).toHaveBeenCalled()
  expect(subscribeMock.mock.calls.length).toBe(2)
})
