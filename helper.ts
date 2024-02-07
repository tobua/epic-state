import { create } from 'logua'

export const log = create('epic-state', 'red')

export const isObject = (x: unknown): x is object => typeof x === 'object' && x !== null

export const listGetters = (input: object) => {
  const descriptors = Object.getOwnPropertyDescriptors(input)
  const getters = {}

  Object.entries(descriptors).forEach(([key, { get }]) => {
    if (typeof get === 'function') {
      getters[key] = get
    }
  })

  return getters
}
