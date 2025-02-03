import { expect, mock, test } from 'bun:test'
import { batch, observe, removeAllPlugins, set, state, toggle } from '../index'
import { PluginAction, type ProxyObject } from '../types'
import { removeProxyObject, setObservationsOnly } from './helper'

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

test('Can observe state changes.', () => {
  const root = state<{ count?: number }>({ count: 1 })

  const observations = observe()

  expect(observations.length).toBe(0)

  // += will do a get and only then a set (both proxy traps invoked).
  ;(root.count as number) += 1

  const readValue = root.count ?? 0
  const double = readValue * 2

  expect(double).toBe(4)

  delete root.count

  // One call to observe for each process.
  batch()
  // All operations are passed as an array in the first argument.
  expect(observations.length).toBe(4)

  expect(removeProxyObject(observations[0])).toEqual([PluginAction.Get, 'count', 1]) // From += 1
  expect(removeProxyObject(observations[1])).toEqual([PluginAction.Set, 'count', 2, 1])
  expect(removeProxyObject(observations[2])).toEqual([PluginAction.Get, 'count', 2]) // From root.count
  expect(removeProxyObject(observations[3])).toEqual([PluginAction.Delete, 'count', 2])
})

test('Changes to non existing properties are tracked.', () => {
  const root = state<{ count?: string; later?: number }>({ count: undefined })

  const observations = observe()

  expect(observations.length).toBe(0)

  root.count = '5'
  root.later = 10

  batch()

  expect(root.count).toBe('5')
  expect(root.later).toBe(10)
})

test('State changes after async waiting period are observed.', async () => {
  const root = state({
    count: 1,
    async increment() {
      await new Promise((done) => {
        setTimeout(done, 10)
      })
      root.count += 1
    },
  })

  const observations = observe()

  expect(root.count).toBe(1)
  expect(observations.length).toBe(1) // get call.

  await root.increment()

  expect(root.count).toBe(2)
  expect(observations.length).toBe(4) // get from increment, set from increment and get from expect.

  root.increment()

  await new Promise((done) => setTimeout(done, 20)) // Necessary since previous not awaited.

  expect(root.count).toBe(3)
  expect(observations.length).toBe(7)
})

test('Can unsubscribe from an observation.', () => {
  const root = state({ count: 1 })
  const observations = observe()

  root.count += 1
  batch()

  expect(setObservationsOnly(observations).length).toBe(1)
  removeAllPlugins()

  root.count += 1
  batch()

  expect(setObservationsOnly(observations).length).toBe(1)
})

test('Observe will only observe changes to the passed state.', () => {
  const firstRoot = state({ nested: { count: 1 } })
  const secondRoot = state({ nested: { count: 2 } })

  const observations = observe(undefined, firstRoot as unknown as ProxyObject) // TODO shouldn't be necessary.

  firstRoot.nested.count += 1
  secondRoot.nested.count += 1

  batch()
  expect(observations.length).toBe(2) // secondRoot ignored.
  expect(observations[0][0]).toEqual(PluginAction.Get)
  expect(observations[1][0]).toEqual(PluginAction.Set)
  expect(observations[1][3]).toEqual(2) // New value for firstRoot
})

test('Can subscribe to nested state changes.', () => {
  const root = state({ count: { nested: 1 } })

  const observations = observe()

  expect(observations.length).toBe(0)

  root.count.nested += 1

  batch()

  expect(observations.length).toBeGreaterThan(0)
  const setOnly = setObservationsOnly(observations)
  expect(setOnly.length).toBe(1)

  expect(removeProxyObject(setOnly[0])).toEqual([PluginAction.Set, 'nested', 2, 1])
})

test('Can subscribe to deeply nested state changes.', () => {
  const root = state({ values: [{ nested: { value: 2 } }, { nested: { value: 3 } }] })

  const observations = observe()

  root.values[0].nested.value += 1

  batch()

  const setOnly = setObservationsOnly(observations)
  expect(setOnly.length).toBe(1)
  expect(removeProxyObject(setOnly[0])).toEqual([PluginAction.Set, 'value', 3, 2])
})

test('Destructured objects are still tracked.', () => {
  const root = state({ hello: 'world', nested: { value: 1 } })

  const observations = observe()

  let { hello } = root
  const { nested } = root

  expect(hello).toEqual('world')
  expect(nested.value).toBe(1)

  hello = 'changed'
  nested.value += 1

  batch()

  expect(root.hello).toEqual('world') // Changes not propagated, cannot observe basic values.
  expect(root.nested.value).toBe(2)

  const setOnly = setObservationsOnly(observations)

  expect(setOnly.length).toBe(1)
  expect(removeProxyObject(setOnly[0])).toEqual([PluginAction.Set, 'value', 2, 1])
})

test('Arrays, Maps and Sets are also tracked.', () => {
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

  const observations = observe()

  root.list.push(4)
  root.map.set('city', 'Los Angeles')
  root.set.add('fig')

  const age = (root.map as any).get('age') as { value: number }
  // TODO change isn't tracked.
  age.value += 1

  batch()

  const setOnly = setObservationsOnly(observations)

  expect(setOnly.length).toBe(1)
  // TODO map and set aren't tracked.
  expect(removeProxyObject(setOnly[0])).toEqual([PluginAction.Set, '3', 4, undefined])
})

test.skip('Map/Set polyfill works at the top-level.', () => {
  const root = state(new Set([{ name: 'apple' }, { name: 'banana' }, { name: 'cherry' }, { name: 'apple' }]))

  const observations = observe()

  root.add({ name: 'fig' })

  batch()

  const setOnly = setObservationsOnly(observations)

  expect(setOnly.length).toBe(1)
  expect(removeProxyObject(setOnly[0])).toEqual([PluginAction.Set, 'fig', { name: 'fig' }, undefined])
})

test('Works with classes.', () => {
  const root = state(
    new (class State {
      hello = 'world'
    })(),
  )

  const observations = observe()

  root.hello = 'changed'

  batch()

  const setOnly = setObservationsOnly(observations)
  expect(setOnly.length).toBe(1)
  expect(removeProxyObject(setOnly[0])).toEqual([PluginAction.Set, 'hello', 'changed', 'world'])
})

test('Added objects will also be observed.', () => {
  const root: any = state({ count: 1 })

  const observations = observe()

  root.nested = {
    value: 1,
  }

  batch()

  expect(root.nested.value).toBe(1)

  let setOnly = setObservationsOnly(observations)
  expect(setOnly.length).toBe(0) // TODO needs to be tracked.
  // expect(setOnly[0]).toEqual([PluginAction.Set, 'nested', { value: 1 }, undefined])

  root.nested.value += 1

  batch()

  setOnly = setObservationsOnly(observations)
  expect(setOnly.length).toBe(1)
  expect(removeProxyObject(setOnly[0])).toEqual([PluginAction.Set, 'value', 2, 1])

  // Read from expect.
  expect(observations.length).toBe(3) // TODO should be 5.
  // TODO access path should be merged into one call.
  // expect(removeProxyObject(observations[0])).toEqual([PluginAction.Get, 'nested', { value: 2 }])
  expect(removeProxyObject(observations[0])).toEqual([PluginAction.Get, 'value', 1])
  // Read from += 1.
  // expect(removeProxyObject(observations[2])).toEqual([PluginAction.Get, 'nested', { value: 2 }])
  expect(removeProxyObject(observations[1])).toEqual([PluginAction.Get, 'value', 1])
  expect(removeProxyObject(observations[2])).toEqual([PluginAction.Set, 'value', 2, 1])
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

test('Will granuarly replace whole objects.', () => {
  const root = state<{ nested?: { count: number; anotherCount: number }; newProxy?: { count: number; anotherCount?: number } }>({
    nested: {
      count: 1,
      anotherCount: 2,
    },
  })

  const observations = observe()

  if (root.nested) {
    root.nested.count = 2

    expect(root.nested.count).toBe(2)
    expect(observations.length).toBe(2) // set + get (from expect)
  } else {
    expect(false).toBe(true)
  }

  root.nested = { count: 3, anotherCount: 3 }

  expect(observations.length).toBe(4)
  expect(observations[2][2]).toBe('count')
  expect(observations[3][2]).toBe('anotherCount')
  expect(root.nested.count).toBe(3)

  root.newProxy = { count: 8 }

  expect(observations.length).toBe(5)
  expect(observations[4][2]).toBe('count')
  expect(root.newProxy.count).toBe(8)

  root.newProxy.anotherCount = 3

  expect(observations.length).toBe(7)
  expect(observations[6][2]).toBe('anotherCount')
  expect(root.newProxy.anotherCount).toBe(3)

  root.newProxy = { count: 1 }

  expect(observations.length).toBe(10)
  expect(observations[8][0]).toBe(PluginAction.Set)
  expect(observations[8][2]).toBe('count')
  // Existing properties no longer found will be deleted.
  expect(observations[9][0]).toBe(PluginAction.Delete)
  expect(observations[9][2]).toBe('anotherCount')

  root.nested = undefined

  expect(observations.length).toBe(11)
  expect(observations[10][0]).toBe(PluginAction.Set)
  expect(observations[10][2]).toBe('nested')
  expect(observations[10][3]).toBe(undefined)

  delete root.newProxy

  expect(observations.length).toBe(12)
  expect(observations[11][0]).toBe(PluginAction.Delete)
  expect(observations[11][2]).toBe('newProxy')
  expect(observations[11][4]).toBe(undefined)
})

test('Object.keys() returns all keys.', () => {
  const first = state<{ first: number; second?: number }>({ first: 1 })
  const second = state<{ first: number; second: number; third?: number }>({ first: 2, second: 3 })

  expect(Object.keys(first)).toEqual(['first'])
  expect(Object.keys(second)).toEqual(['first', 'second'])

  first.second = 2
  second.third = 4

  // TODO keys no longer update.
  // expect(Object.keys(first)).toEqual(['first', 'second'])
  // expect(Object.keys(second)).toEqual(['first', 'second', 'third'])
  // TODO object no longer updates
  // expect(JSON.stringify(second)).toEqual(`{ \"first\": 2, \"second\": 3, \"third\": 4 }`)
})

test('Helpers for JSX value callbacks.', () => {
  const root = state({
    count: 1,
    anotherCount: 2,
    active: false,
    open: true,
    nested: { count: 1, hidden: false },
  })

  const setterCount = set(root, 'count')
  // @ts-expect-error
  set(root, 'missing-count')
  const setterAnotherCount = set(root, 'anotherCount')
  const setterNestedCount = set(root.nested, 'count')

  const toggleActive = toggle(root, 'active')
  const toggleOpen = toggle(root, 'open')
  // @ts-expect-error
  toggle(root, 'missing')
  const toggleNested = toggle(root.nested, 'hidden')
  // @ts-expect-error
  toggle(root, 'count')

  setterCount(2)
  setterAnotherCount(3)
  setterNestedCount(2)

  toggleActive()
  toggleOpen()
  toggleNested()

  expect(root.count).toBe(2)
  expect(root.anotherCount).toBe(3)
  expect(root.nested.count).toBe(2)
  expect(root.active).toBe(true)
  expect(root.open).toBe(false)
  expect(root.nested.hidden).toBe(true)

  setterCount(5)
  // @ts-expect-error
  setterCount('7')
  setterCount(6)
  toggleActive()
  toggleActive()
  toggleActive()

  expect(root.count).toBe(6)
  expect(root.active).toBe(false)
})
