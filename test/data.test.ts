import { expect, test, vi } from 'vitest'
import { state, observe, list } from '../index'
import { process } from './helper'

const counter = (initialCount: number) => ({
  count: initialCount,
})

test('list: empty list initialized properly.', () => {
  const root = state({ emptyList: list(counter), anotherEmptyList: list(counter, []) })

  expect(root.emptyList.length).toBe(0)
  expect(root.anotherEmptyList.length).toBe(0)
})

test('list: list can be initialized with values, values can be read and are reactive.', async () => {
  const subscribeMock = vi.fn()
  const counterComplex = (intialCount: number) => {
    const data = {
      nested: {
        count: intialCount,
        get double() {
          return data.nested.count * 2
        },
      },
    }
    return data
  }

  const root = state({
    simpleList: list(counter, [1, 2]),
    complexList: list(counterComplex, [3, 4, 5]),
  })

  observe(subscribeMock, root)

  expect(root.simpleList.length).toBe(2)
  expect(root.complexList.length).toBe(3)

  expect(root.simpleList[0].count).toBe(1)
  expect(root.simpleList[1].count).toBe(2)
  expect(root.complexList[1].nested.count).toBe(4)
  expect(root.complexList[1].nested.double).toBe(8)
  // @ts-expect-error
  expect(root.complexList[1].missing).toBe(undefined)

  expect(subscribeMock).not.toHaveBeenCalled()

  root.simpleList[0].count = 2
  root.complexList[1].nested.count = 8

  await process()

  expect(root.simpleList[0].count).toBe(2)
  expect(root.complexList[1].nested.count).toBe(8)
  expect(subscribeMock).toHaveBeenCalledTimes(1)

  // TODO are this many calls necessary?
  // TODO possibly revert getter calls later after a set has happened...
  const setterCalls = subscribeMock.mock.calls[0][0].filter((call) => call[0] === 'set')
  expect(setterCalls[0]).toEqual(['set', ['simpleList', '0', 'count'], 2, 1])
  expect(setterCalls[1]).toEqual(['set', ['complexList', '1', 'nested', 'count'], 8, 4])
})

test('list: element instances can be added to list through custom add() method.', () => {
  const root = state({ data: list(counter) })

  root.data.add(1)

  expect(root.data.length).toBe(1)
  expect(root.data[0].count).toBe(1)
})

test('list: element instances can be removed without reference to the parent.', () => {
  const root = state({ data: list(counter, [1, 2, 3]) })

  expect(root.data.length).toBe(3)
  expect(root.data[1].count).toBe(2)

  root.data[1].remove()

  expect(root.data.length).toBe(2)
  expect(root.data[1].count).toBe(3)
})

// TODO
test.skip('list: can be used at the top-level.', () => {
  const item = (initialCount: number) => ({
    count: initialCount,
  })

  const root = state(list(item, [1]))

  expect(root.length).toBe(1)
  expect(root[0].count).toBe(1)
})
