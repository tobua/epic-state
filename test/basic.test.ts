import { expect, test, vi } from 'vitest'
import { state, subscribe, snapshot, getVersion, remove } from '../index'
import { proxyMap, proxySet } from '../src/vanilla/utils'

const process = () =>
  new Promise((done) => {
    setTimeout(done, 1)
  })

test('Object with values is converted to a proxy and state can be changed.', () => {
  const root = state({ hello: 'world', count: 1 })

  expect(root.hello).toBe('world')
  expect(root.count).toBe(1)

  root.count += 1

  expect(root.count).toBe(2)
})

test('Multiple states can be created.', () => {
  const first = state({ count: 2 })
  const second = state({ count: 3 })

  expect(first.count).toBe(2)
  expect(second.count).toBe(3)

  first.count += 1
  second.count += 2

  expect(first.count).toBe(3)
  expect(second.count).toBe(5)
})

test('Can subscribe to state changes.', async () => {
  const subscribeMock = vi.fn()
  const root = state({ count: 1 })

  expect(subscribeMock).not.toHaveBeenCalled()

  subscribe(root, subscribeMock)

  root.count += 1

  await process()

  expect(subscribeMock).toHaveBeenCalled()
  const [[operation, [property], valueAfter, valueBefore]] = subscribeMock.mock.calls[0][0]

  expect(operation).toBe('set')
  expect(property).toBe('count')
  expect(valueAfter).toBe(2)
  expect(valueBefore).toBe(1)
})

test('Changes to a snapshot remain untracked.', async () => {
  const subscribeMock = vi.fn()
  const root = state({ count: 1 })

  subscribe(root, subscribeMock)

  const untrackedRoot = snapshot(root)

  expect(() => {
    // @ts-expect-error object frozen
    untrackedRoot.count += 1
  }).toThrow()

  await process()

  expect(subscribeMock).not.toHaveBeenCalled()
})

test('Each proxy has a version.', () => {
  const root = state({ count: 1 })
  const anotherRoot = state({ count: 2 })
  let version = getVersion(root)
  const anotherVersion = getVersion(anotherRoot)

  expect(typeof version).toBe('number')
  expect(typeof anotherVersion).toBe('number')
  expect(version !== anotherVersion).toBe(true)

  remove(root)

  version = getVersion(root)

  expect(typeof version).toBe('undefined')
})

test('Can subscribe to nested state changes.', async () => {
  const subscribeMock = vi.fn()
  const root = state({ count: { nested: 1 } })

  expect(subscribeMock).not.toHaveBeenCalled()

  subscribe(root, subscribeMock)

  root.count.nested += 1

  await process()

  expect(subscribeMock).toHaveBeenCalled()
  const [[operation, [...properties], valueAfter, valueBefore]] = subscribeMock.mock.calls[0][0]

  expect(operation).toBe('set')
  expect(properties).toEqual(['count', 'nested'])
  expect(valueAfter).toBe(2)
  expect(valueBefore).toBe(1)
})

test('Can subscribe to deeply nested state changes.', async () => {
  const subscribeMock = vi.fn()
  const root = state({ values: [{ nested: { value: 2 } }, { nested: { value: 3 } }] })

  expect(subscribeMock).not.toHaveBeenCalled()

  subscribe(root, subscribeMock)

  root.values[0].nested.value += 1

  await process()

  expect(subscribeMock).toHaveBeenCalled()
  const [[operation, [...properties], valueAfter, valueBefore]] = subscribeMock.mock.calls[0][0]

  expect(operation).toBe('set')
  expect(properties).toEqual(['values', '0', 'nested', 'value'])
  expect(valueAfter).toBe(3)
  expect(valueBefore).toBe(2)
})

test('Destructured objects are still tracked.', async () => {
  const subscribeMock = vi.fn()
  const root = state({ hello: 'world', nested: { value: 1 } })

  expect(subscribeMock).not.toHaveBeenCalled()

  subscribe(root, subscribeMock)

  let { hello } = root
  const { nested } = root

  expect(hello).toEqual('world')
  expect(nested).toEqual({ value: 1 })

  hello = 'changed'
  nested.value += 1

  await process()

  expect(root.hello).toEqual('world') // Changes not propagated, cannot observe basic values.
  expect(root.nested).toEqual({ value: 2 })

  expect(subscribeMock).toHaveBeenCalled()
  const [[operation, [property], valueAfter, valueBefore]] = subscribeMock.mock.calls[0][0]

  expect(operation).toBe('set')
  expect(property).toBe('nested')
  expect(valueAfter).toBe(2)
  expect(valueBefore).toBe(1)
})

test('Arrays, Maps and Sets are also tracked.', async () => {
  const subscribeMock = vi.fn()
  const root = state({
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

  subscribe(root, subscribeMock)

  root.array.push(4)
  root.map.set('city', 'Los Angeles')
  root.set.add('fig')

  await process()

  expect(subscribeMock.mock.calls.length).toBe(1)

  expect(subscribeMock.mock.calls[0][0][0][0]).toBe('set')
  expect(subscribeMock.mock.calls[0][0][0][2]).toBe(4)
  // TODO map and set aren't tracked.
  expect(subscribeMock.mock.calls[1]).toBe(undefined)
  expect(subscribeMock.mock.calls[2]).toBe(undefined)
})

test('Works with classes.', async () => {
  const subscribeMock = vi.fn()
  const root = state(
    new (class State {
      hello = 'world'
    })()
  )

  subscribe(root, subscribeMock)

  root.hello = 'changed'

  await process()

  expect(subscribeMock).toHaveBeenCalled()
  const [[operation, [property], valueAfter, valueBefore]] = subscribeMock.mock.calls[0][0]

  expect(operation).toBe('set')
  expect(property).toBe('hello')
  expect(valueAfter).toBe('changed')
  expect(valueBefore).toBe('world')
})
