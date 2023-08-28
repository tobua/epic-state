import { expect, test, vi } from 'vitest'
import { proxy, subscribe } from '../src/index'
import { proxyMap, proxySet } from '../src/vanilla/utils'

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

test('Arrays, Maps and Sets are also tracked.', async () => {
  const subscribeMock = vi.fn()
  const state = proxy({
    array: [1, 2, 3],
    // TODO automatically transform Map and Set.
    map: proxyMap<string, string | number | boolean>([
      ['name', 'John'],
      ['age', 30],
      ['city', 'New York'],
      ['isStudent', false],
    ]),
    set: proxySet(['apple', 'banana', 'cherry', 'apple']),
  })

  subscribe(state, subscribeMock)

  state.array.push(4)
  state.map.set('city', 'Los Angeles')
  state.set.add('fig')

  await process()

  expect(subscribeMock.mock.calls.length).toBe(1)

  expect(subscribeMock.mock.calls[0][0][0][0]).toBe('set')
  expect(subscribeMock.mock.calls[0][0][0][2]).toBe(4)
  // TODO map and set aren't tracked.
  expect(subscribeMock.mock.calls[1]).toBe(undefined)
  expect(subscribeMock.mock.calls[2]).toBe(undefined)
})
