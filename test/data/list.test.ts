import { expect, test } from 'bun:test'
import { list, observe, state } from '../../index'
import { PluginAction } from '../../types'
import { removeProxyObject, setObservationsOnly } from '../helper'

global.stateDisableBatching = true

const counter = (initialCount: number) => ({
  count: initialCount,
})

test('list: empty list initialized properly.', () => {
  const root = state({ emptyList: list(counter), anotherEmptyList: list(counter, []) })

  expect(root.emptyList.length).toBe(0)
  expect(root.anotherEmptyList.length).toBe(0)
})

test('list: list can be initialized with values, values can be read and are reactive.', async () => {
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

  const observations = observe()

  expect(root.simpleList.length).toBe(2)
  expect(root.complexList.length).toBe(3)

  expect(root.simpleList[0].count).toBe(1)
  expect(root.simpleList[1].count).toBe(2)
  expect(root.complexList[1].nested.count).toBe(4)
  expect(root.complexList[1].nested.double).toBe(8)
  // @ts-expect-error
  expect(root.complexList[1].missing).toBe(undefined)

  expect(observations.length).toBe(5)

  root.simpleList[0].count = 2
  root.complexList[1].nested.count = 8

  expect(root.simpleList[0].count).toBe(2)
  expect(root.complexList[1].nested.count).toBe(8)
  expect(observations.length).toBe(9)

  // TODO are this many calls necessary?
  // TODO possibly revert getter calls later after a set has happened...
  const setOnly = setObservationsOnly(observations)
  expect(removeProxyObject(setOnly[0])).toEqual([PluginAction.Set, 'count', 2, 1])
  expect(removeProxyObject(setOnly[1])).toEqual([PluginAction.Set, 'count', 8, 4])
})

test('list: data structure is an extended array.', () => {
  const root = state({ data: list(counter, [1]) })

  expect(root.data.splice).toBeDefined()
  expect(root.data.size).toBe(1)
  expect(root.data.length).toBe(1)
  expect(Array.isArray(root.data)).toBe(true)

  root.data.add(2)

  expect(root.data.size).toBe(2)

  expect(root.data.map((item) => item.count)).toEqual([1, 2])
})

test('list: element instances can be added to list through custom add() method.', () => {
  const root = state({ data: list(counter) })

  root.data.add(1)

  expect(root.data.length).toBe(1)
  expect(root.data[0].count).toBe(1)
})

test('list: all elements can be replaced with replace.', () => {
  const root = state({ data: list(counter) })

  root.data.replace([1, 2])

  expect(root.data.length).toBe(2)
  expect(root.data[0].count).toBe(1)
  expect(root.data[1].count).toBe(2)
})

test('list: changes to list are observed.', () => {
  const root = state({ data: list(counter) })

  const observations = observe()

  expect(observations.length).toBe(0)

  root.data.replace([1])

  expect(observations.length).toBe(1)
  expect(root.data.length).toBe(1)

  root.data.replace([1, 2])

  expect(observations.length).toBe(3)
  expect(root.data.length).toBe(2)
})

test('list: element instances can be removed without reference to the parent.', () => {
  const root = state({ data: list(counter, [1, 2, 3]) })

  expect(root.data.length).toBe(3)
  expect(root.data[1].count).toBe(2)

  root.data[1].remove()

  expect(root.data.length).toBe(2)
  expect(root.data[1].count).toBe(3)
})

// biome-ignore lint/suspicious/noSkippedTests: TODO
test.skip('list: can be used at the top-level.', () => {
  const item = (initialCount: number) => ({
    count: initialCount,
  })

  const root = state(list(item, [1]))

  expect(root.length).toBe(1)
  expect(root[0].count).toBe(1)
})
