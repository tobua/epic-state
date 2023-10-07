import { expect, test, vi } from 'vitest'
import { state, observe, snapshot, getVersion, remove } from '../index'

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

test('Can observe state changes.', async () => {
  const subscribeMock = vi.fn()
  const root = state<{ count?: number }>({ count: 1 })

  expect(subscribeMock).not.toHaveBeenCalled()

  observe(root, subscribeMock)

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

test('Can unsubscribe from an observation.', async () => {
  const subscribeMock = vi.fn()
  const root = state({ count: 1 })

  expect(subscribeMock).not.toHaveBeenCalled()

  const unsubscribe = observe(root, (values) =>
    subscribeMock(values.filter((value) => value[0] !== 'get')),
  )

  root.count += 1

  await process()

  expect(subscribeMock.mock.calls.length).toBe(1)

  unsubscribe()

  root.count += 1

  await process()

  expect(subscribeMock.mock.calls.length).toBe(1)
})

test('Observe will only observe changes to the passed state.', async () => {
  const subscribeMock = vi.fn()
  const firstRoot = state({ nested: { count: 1 } })
  const secondRoot = state({ nested: { count: 2 } })

  observe(secondRoot, subscribeMock)

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

test('Changes to a snapshot remain untracked.', async () => {
  const subscribeMock = vi.fn()
  const root = state({ count: 1 })

  observe(root, subscribeMock)

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

  observe(root, (values) => subscribeMock(values.filter((value) => value[0] !== 'get')))

  root.count.nested += 1

  await process()

  expect(subscribeMock).toHaveBeenCalled()

  expect(subscribeMock.mock.calls[0][0][0]).toEqual(['set', ['count', 'nested'], 2, 1])
})

test('Can subscribe to deeply nested state changes.', async () => {
  const subscribeMock = vi.fn()
  const root = state({ values: [{ nested: { value: 2 } }, { nested: { value: 3 } }] })

  expect(subscribeMock).not.toHaveBeenCalled()

  observe(root, (values) => subscribeMock(values.filter((value) => value[0] !== 'get')))

  root.values[0].nested.value += 1

  await process()

  expect(subscribeMock.mock.calls[0][0].length).toBe(1)
  expect(subscribeMock.mock.calls[0][0][0]).toEqual([
    'set',
    ['values', '0', 'nested', 'value'],
    3,
    2,
  ])
})

test('Destructured objects are still tracked.', async () => {
  const subscribeMock = vi.fn()
  const root = state({ hello: 'world', nested: { value: 1 } })

  expect(subscribeMock).not.toHaveBeenCalled()

  observe(root, (values) => subscribeMock(values.filter((value) => value[0] !== 'get')))

  let { hello } = root
  const { nested } = root

  expect(hello).toEqual('world')
  expect(nested).toEqual({ value: 1 })

  hello = 'changed'
  nested.value += 1

  await process()

  expect(root.hello).toEqual('world') // Changes not propagated, cannot observe basic values.
  expect(root.nested).toEqual({ value: 2 })

  expect(subscribeMock.mock.calls[0][0].length).toBe(1)
  expect(subscribeMock.mock.calls[0][0][0]).toEqual(['set', ['nested', 'value'], 2, 1])
})

test('Arrays, Maps and Sets are also tracked.', async () => {
  const subscribeMock = vi.fn()
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

  observe(root, (values) => subscribeMock(values.filter((value) => value[0] !== 'get')))

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
  const subscribeMock = vi.fn()
  const root = state(
    new Set([{ name: 'apple' }, { name: 'banana' }, { name: 'cherry' }, { name: 'apple' }]),
  )

  observe(root, (values) => subscribeMock(values.filter((value) => value[0] !== 'get')))

  root.add({ name: 'fig' })

  const element = root.values().next()

  await process()
})

test('Works with classes.', async () => {
  const subscribeMock = vi.fn()
  const root = state(
    new (class State {
      hello = 'world'
    })(),
  )

  observe(root, (values) => subscribeMock(values.filter((value) => value[0] !== 'get')))

  root.hello = 'changed'

  await process()

  expect(subscribeMock.mock.calls[0][0].length).toBe(1)
  expect(subscribeMock.mock.calls[0][0][0]).toEqual(['set', ['hello'], 'changed', 'world'])
})

test('Added objects will also be observed.', async () => {
  const subscribeMock = vi.fn()
  const root: any = state({ count: 1 })

  expect(subscribeMock).not.toHaveBeenCalled()

  observe(root, subscribeMock)

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
