import { expect, test } from 'vitest'
import { listGetters } from '../helper'

test('Correctly recoginizes getter values on an object.', () => {
  const state = {
    count: 1,
    get double() {
      return state.count * 2
    },
    set setCount(value: number) {
      state.count = value
    },
    increment: () => {
      state.count += 1
    },
  }

  const getterObject = listGetters(state)
  const getters = Object.keys(getterObject)

  expect(getters.length).toBe(1)
  expect(getters).toContain('double')
  expect(getters).not.toContain('count')
  expect(getters).not.toContain('increment')
  expect(getters).not.toContain('setCount')

  expect(state.count).toBe(1)
  expect(state.double).toBe(2)

  state.increment()

  expect(state.count).toBe(2)
  expect(state.double).toBe(4)

  state.setCount = 5

  expect(state.count).toBe(5)
  expect(state.double).toBe(10)
})
