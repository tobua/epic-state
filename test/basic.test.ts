import { expect, mock, test } from 'bun:test'
import { getVersion, observe, remove, state } from '../index'
import { process } from './helper'

global.stateDisableBatching = true

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

test('Can observe state changes.', async () => {
  const subscribeMock = mock()
  const root = state<{ count?: number }>({ count: 1 })

  expect(subscribeMock).not.toHaveBeenCalled()

  observe(subscribeMock, root)

  // += will do a get and only then a set (both proxy traps invoked).
  ;(root.count as number) += 1

  const readValue = root.count ?? 0
  const double = readValue * 2

  expect(double).toBe(4)

  delete root.count

  // One call to observe for each process.
  await process()

  expect(subscribeMock).toHaveBeenCalled()
  expect(subscribeMock.mock.calls.length).toBe(1)
  // All operations are passed as an array in the first argument.
  expect(subscribeMock.mock.calls[0][0].length).toBe(4)

  expect(subscribeMock.mock.calls[0][0][0]).toEqual(['get', ['count'], 1]) // From += 1
  expect(subscribeMock.mock.calls[0][0][1]).toEqual(['set', ['count'], 2, 1])
  expect(subscribeMock.mock.calls[0][0][2]).toEqual(['get', ['count'], 2]) // From root.count
  expect(subscribeMock.mock.calls[0][0][3]).toEqual(['delete', ['count'], 2])
})

test('State changes after async waiting period are observed.', async () => {
  const subscribeMock = mock()
  const root = state({
    count: 1,
    async increment() {
      await new Promise((done) => {
        setTimeout(done, 10)
      })
      root.count += 1
    },
  })

  const removeObserve = observe(subscribeMock, root, true)

  expect(root.count).toBe(1)
  expect(subscribeMock).toHaveBeenCalledTimes(1) // get call.

  await root.increment()

  expect(root.count).toBe(2)
  expect(subscribeMock).toHaveBeenCalledTimes(4) // get from increment, set from increment and get from expect.

  root.increment()

  await new Promise((done) => {
    setTimeout(done, 20)
  })

  expect(root.count).toBe(3)
  expect(subscribeMock).toHaveBeenCalledTimes(7)

  removeObserve()
})

test('Can unsubscribe from an observation.', async () => {
  const subscribeMock = mock()
  const root = state({ count: 1 })

  expect(subscribeMock).not.toHaveBeenCalled()

  const unsubscribe = observe((values) => subscribeMock(values.filter((value) => value[0] !== 'get')), root)

  root.count += 1

  await process()

  expect(subscribeMock.mock.calls.length).toBe(1)

  unsubscribe()

  root.count += 1

  await process()

  expect(subscribeMock.mock.calls.length).toBe(1)
})

test('Observe will only observe changes to the passed state.', async () => {
  const subscribeMock = mock()
  const firstRoot = state({ nested: { count: 1 } })
  const secondRoot = state({ nested: { count: 2 } })

  observe(subscribeMock, secondRoot)

  firstRoot.nested.count += 1
  secondRoot.nested.count += 1

  await process()

  expect(subscribeMock).toHaveBeenCalled()
  expect(subscribeMock.mock.calls.length).toBe(1)
  expect(subscribeMock.mock.calls[0][0].length).toBe(3)
  expect(subscribeMock.mock.calls[0][0][0][0]).toEqual('get')
  expect(subscribeMock.mock.calls[0][0][1][0]).toEqual('get')
  expect(subscribeMock.mock.calls[0][0][2][0]).toEqual('set') // Only one set for secondRoot.
})

test('Each proxy has a version.', () => {
  const root = state({ count: 1 })
  const anotherRoot = state({ count: 2 })
  let version = getVersion(root)
  const anotherVersion = getVersion(anotherRoot)

  expect(typeof version).toBe('number')
  expect(typeof anotherVersion).toBe('number')
  expect(version === anotherVersion).toBe(true)

  root.count = 3

  version = getVersion(root)

  expect(version !== anotherVersion).toBe(true)

  remove(root)

  version = getVersion(root)

  expect(typeof version).toBe('undefined')
})

test('Can subscribe to nested state changes.', async () => {
  const subscribeMock = mock()
  const root = state({ count: { nested: 1 } })

  expect(subscribeMock).not.toHaveBeenCalled()

  observe((values) => subscribeMock(values.filter((value) => value[0] !== 'get')), root)

  root.count.nested += 1

  await process()

  expect(subscribeMock).toHaveBeenCalled()

  expect(subscribeMock.mock.calls[0][0][0]).toEqual(['set', ['count', 'nested'], 2, 1])
})

test('Can subscribe to deeply nested state changes.', async () => {
  const subscribeMock = mock()
  const root = state({ values: [{ nested: { value: 2 } }, { nested: { value: 3 } }] })

  expect(subscribeMock).not.toHaveBeenCalled()

  observe((values) => subscribeMock(values.filter((value) => value[0] !== 'get')), root)

  root.values[0].nested.value += 1

  await process()

  expect(subscribeMock.mock.calls[0][0].length).toBe(1)
  expect(subscribeMock.mock.calls[0][0][0]).toEqual(['set', ['values', '0', 'nested', 'value'], 3, 2])
})

test('Destructured objects are still tracked.', async () => {
  const subscribeMock = mock()
  const root = state({ hello: 'world', nested: { value: 1 } })

  expect(subscribeMock).not.toHaveBeenCalled()

  observe((values) => subscribeMock(values.filter((value) => value[0] !== 'get')), root)

  let { hello } = root
  const { nested } = root

  expect(hello).toEqual('world')
  expect(nested.value).toBe(1)

  hello = 'changed'
  nested.value += 1

  await process()

  expect(root.hello).toEqual('world') // Changes not propagated, cannot observe basic values.
  expect(root.nested.value).toBe(2)

  expect(subscribeMock.mock.calls[0][0].length).toBe(1)
  expect(subscribeMock.mock.calls[0][0][0]).toEqual(['set', ['nested', 'value'], 2, 1])
})

test('Arrays, Maps and Sets are also tracked.', async () => {
  const subscribeMock = mock()
  const root = state({
    list: [1, 2, 3],
    // TODO automatically transform Map and Set.
    map: new Map<string, string | { value: number } | boolean>([
      ['name', 'John'],
      ['age', { value: 30 }],
      ['city', 'New York'],
      ['isStudent', false],
    ]),
    set: new Set(['apple', 'banana', 'cherry', 'apple']),
  })

  observe((values) => subscribeMock(values.filter((value) => value[0] !== 'get')), root)

  root.list.push(4)
  root.map.set('city', 'Los Angeles')
  root.set.add('fig')

  const age = (root.map as any).get('age') as { value: number }
  // TODO change isn't tracked.
  age.value += 1

  await process()

  expect(subscribeMock.mock.calls.length).toBe(1)
  expect(subscribeMock.mock.calls[0].length).toBe(1)
  // TODO map and set aren't tracked.
  expect(subscribeMock.mock.calls[0][0].length).toBe(1)
  expect(subscribeMock.mock.calls[0][0][0]).toEqual(['set', ['list', '3'], 4, undefined])
})

// TODO doesn't work yet.
test.skip('Map/Set polyfill works at the top-level.', async () => {
  const subscribeMock = mock()
  const root = state(new Set([{ name: 'apple' }, { name: 'banana' }, { name: 'cherry' }, { name: 'apple' }]))

  observe((values) => subscribeMock(values.filter((value) => value[0] !== 'get')), root)

  root.add({ name: 'fig' })

  // const element = root.values().next()

  // await process()
})

test('Works with classes.', async () => {
  const subscribeMock = mock()
  const root = state(
    new (class State {
      hello = 'world'
    })(),
  )

  observe((values) => subscribeMock(values.filter((value) => value[0] !== 'get')), root)

  root.hello = 'changed'

  await process()

  expect(subscribeMock.mock.calls[0][0].length).toBe(1)
  expect(subscribeMock.mock.calls[0][0][0]).toEqual(['set', ['hello'], 'changed', 'world'])
})

test('Added objects will also be observed.', async () => {
  const subscribeMock = mock()
  const root: any = state({ count: 1 })

  expect(subscribeMock).not.toHaveBeenCalled()

  observe(subscribeMock, root)

  root.nested = {
    value: 1,
  }

  await process()

  expect(root.nested.value).toBe(1)

  root.nested.value += 1

  await process()

  expect(subscribeMock).toHaveBeenCalled()
  expect(subscribeMock.mock.calls.length).toBe(2)

  expect(subscribeMock.mock.calls[0][0].length).toBe(1)
  expect(subscribeMock.mock.calls[0][0][0]).toEqual(['set', ['nested'], { value: 1 }, undefined])

  expect(subscribeMock.mock.calls[1][0].length).toBe(5)
  // Read from expect.
  // TODO access path should be merged into one call.
  expect(subscribeMock.mock.calls[1][0][0]).toEqual(['get', ['nested'], { value: 2 }])
  expect(subscribeMock.mock.calls[1][0][1]).toEqual(['get', ['nested', 'value'], 1])
  // Read from += 1.
  expect(subscribeMock.mock.calls[1][0][2]).toEqual(['get', ['nested'], { value: 2 }])
  expect(subscribeMock.mock.calls[1][0][3]).toEqual(['get', ['nested', 'value'], 1])
  expect(subscribeMock.mock.calls[1][0][4]).toEqual(['set', ['nested', 'value'], 2, 1])
})

test('Derived values can be added to the state.', () => {
  const doubleMock = mock(() => root.count * 2)
  const root = state({ count: 1, doubleCount: doubleMock })

  expect(root.count).toBe(1)
  expect(root.doubleCount()).toBe(2)

  expect(doubleMock.mock.calls.length).toBe(1)

  expect(root.doubleCount()).toBe(2)
  // TODO should not increase as value is derived.
  expect(doubleMock.mock.calls.length).toBe(2)

  root.count += 1

  expect(root.count).toBe(2)
  expect(root.doubleCount()).toBe(4)

  expect(doubleMock.mock.calls.length).toBe(3)
})

test('Promises on state are resolved.', async () => {
  const root = state({
    promise: new Promise((done) => {
      setTimeout(() => done('hello'), 10)
    }),
    rejectedPromise: new Promise((_, reject) => {
      setTimeout(() => reject(new Error('fail')), 10)
    }),
  })

  expect(await root.promise).toBe('hello')
  expect(root.rejectedPromise).rejects.toEqual(new Error('fail'))
})
