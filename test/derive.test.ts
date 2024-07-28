import { expect, mock, test } from 'bun:test'
import { state } from '../index'

global.stateDisableBatching = true

test('Basic derived value test.', async () => {
  const root = state({
    count: 1,
    get double() {
      return root.count * 2
    },
    increment() {
      this.count += 1
    },
  })

  expect(root.double).toBe(2)

  root.increment()

  expect(root.double).toBe(4)
})

test('Derived values will only be recalcuated when any of the attached values have changed.', async () => {
  const doubleMock = mock((root) => root.count * 2)
  const root = state({
    count: 1,
    get double() {
      return doubleMock(root)
    },
    set incrementTo(value: number) {
      root.count = value
    },
  })

  let doubleValue = root.double

  expect(doubleValue).toBe(2)
  expect(doubleMock.mock.calls.length).toBe(1)

  doubleValue = root.double

  expect(doubleValue).toBe(2)
  expect(doubleMock.mock.calls.length).toBe(1)

  root.count = 2

  doubleValue = root.double

  expect(doubleMock.mock.calls.length).toBe(2)
  expect(doubleValue).toBe(4)

  root.incrementTo = 5

  doubleValue = root.double

  expect(doubleMock.mock.calls.length).toBe(3)
  expect(doubleValue).toBe(10)
})

test('Changes that have no effect are ignored.', async () => {
  const doubleMock = mock((root) => root.count * 2)
  const root = state({
    count: 1,
    get double() {
      return doubleMock(root)
    },
  })

  // Initial state.
  expect(root.double).toBe(2)
  expect(doubleMock.mock.calls.length).toBe(1)
  // After actual change.
  root.count = 2
  expect(root.double).toBe(4)
  expect(doubleMock.mock.calls.length).toBe(2)
  // Multiple changes before access.
  root.count = 3
  root.count = 4
  expect(root.double).toBe(8)
  expect(doubleMock.mock.calls.length).toBe(3)
  // No change made.
  expect(root.double).toBe(8)
  expect(doubleMock.mock.calls.length).toBe(3)
  // Change to same value.
  root.count = 4
  root.count = 4
  expect(root.double).toBe(8)
  expect(doubleMock.mock.calls.length).toBe(3)
})

test('Can differentiate between getters and actions.', () => {
  const doubleMock = mock((root) => root.count * 2)
  const root = state({
    count: 1,
    get double() {
      return doubleMock(root)
    },
    increment() {
      root.count += 1
      return root.count
    },
    // NOTE accessing this will always yield the current nesting level.
    incrementByTwoWithThis() {
      this.count += 2
      return this.count
    },
  })

  expect(doubleMock.mock.calls.length).toBe(0)

  expect(root.count).toBe(1)
  expect(root.double).toBe(2)
  expect(doubleMock.mock.calls.length).toBe(1)

  expect(root.increment()).toBe(2)
  expect(root.count).toBe(2)
  expect(root.double).toBe(4)
  expect(doubleMock.mock.calls.length).toBe(2)
  expect(root.double).toBe(4)
  expect(doubleMock.mock.calls.length).toBe(2)

  expect(root.incrementByTwoWithThis()).toBe(4)
  expect(root.count).toBe(4)
  expect(root.double).toBe(8)
  expect(doubleMock.mock.calls.length).toBe(3)
  expect(root.double).toBe(8)
  expect(doubleMock.mock.calls.length).toBe(3)
})

test('Derived values are properly updated in nested structures.', () => {
  const doubleMock = mock((root) => root.firstCount + root.secondCount.value)
  const root = state({
    firstCount: 1,
    secondCount: {
      value: 2,
    },
    get totalCount() {
      return doubleMock(root)
    },
    increment() {
      root.firstCount += 1
      root.secondCount.value += 1
    },
    nested: {
      set secondCount(value: number) {
        root.secondCount.value = value
      },
      set secondCountThis(value: number) {
        this.parent.secondCount.value = value
      },
    },
  })

  expect(doubleMock.mock.calls.length).toBe(0)

  expect(root.firstCount + root.secondCount.value).toBe(3)
  expect(root.totalCount).toBe(3)
  expect(doubleMock.mock.calls.length).toBe(1)

  root.increment()
  expect(root.totalCount).toBe(5)
  expect(doubleMock.mock.calls.length).toBe(2)

  root.secondCount.value += 2
  expect(root.totalCount).toBe(7)
  expect(doubleMock.mock.calls.length).toBe(3)

  expect(root.totalCount).toBe(7)
  expect(root.firstCount).toBe(2)
  expect(root.secondCount.value).toBe(5)
  expect(doubleMock.mock.calls.length).toBe(3)

  root.nested.secondCount = 7

  expect(root.totalCount).toBe(9)
  expect(root.firstCount).toBe(2)
  expect(root.secondCount.value).toBe(7)
  expect(doubleMock.mock.calls.length).toBe(4)

  root.nested.secondCountThis = 5
  root.nested.secondCountThis = 5

  expect(root.totalCount).toBe(7)
  expect(root.firstCount).toBe(2)
  expect(root.secondCount.value).toBe(5)
  expect(doubleMock.mock.calls.length).toBe(5)
})

test('Derived values inside a separate scope are also updated.', () => {
  const doubleMock = mock((root) => root.count * 2)
  const root = state({
    count: 1,
    get double() {
      return doubleMock(root)
    },
    increment() {
      root.count += 1
    },
  })

  function Component() {
    return `${root.count} ${root.double}`
  }

  const render = () => Component()

  expect(doubleMock.mock.calls.length).toBe(0)

  expect(render()).toBe('1 2')

  expect(doubleMock.mock.calls.length).toBe(1)

  root.increment()
  expect(render()).toBe('2 4')

  expect(doubleMock.mock.calls.length).toBe(2)
})
