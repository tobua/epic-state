import { expect, test, vi } from 'vitest'
import { proxy, subscribe } from '../src/index'

const process = () =>
  new Promise((done) => {
    setTimeout(done, 1)
  })

test('Object with values is converted to a proxy and state can be changed.', () => {
  const state = proxy({ hello: 'world', count: 1 })

  expect(state.hello).toBe('world')
  expect(state.count).toBe(1)

  state.count += 1

  expect(state.count).toBe(2)
})

test('Can subscribe to state changes.', async () => {
  const subscribeMock = vi.fn()
  const state = proxy({ hello: 'world', count: 1 })

  expect(subscribeMock).not.toHaveBeenCalled()

  subscribe(state, subscribeMock)

  state.count += 1

  await process()

  expect(subscribeMock).toHaveBeenCalled()
  const [[operation, [property], valueAfter, valueBefore]] = subscribeMock.mock.calls[0][0]

  expect(operation).toBe('set')
  expect(property).toBe('count')
  expect(valueAfter).toBe(2)
  expect(valueBefore).toBe(1)
})

test('Can subscribe to nested state changes.', async () => {
  const subscribeMock = vi.fn()
  const state = proxy({ count: { nested: 1 } })

  expect(subscribeMock).not.toHaveBeenCalled()

  subscribe(state, subscribeMock)

  state.count.nested += 1

  await process()

  expect(subscribeMock).toHaveBeenCalled()
  const [[operation, [...properties], valueAfter, valueBefore]] = subscribeMock.mock.calls[0][0]

  expect(operation).toBe('set')
  expect(properties).toEqual(['count', 'nested'])
  expect(valueAfter).toBe(2)
  expect(valueBefore).toBe(1)
})
