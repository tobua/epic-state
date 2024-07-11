import { create } from 'logua'
import type { Value } from './types'

export const log = create('epic-state', 'red')

export const isObject = (x: unknown): x is object => typeof x === 'object' && x !== null

export const listGetters = (input: object) => {
  const descriptors = Object.getOwnPropertyDescriptors(input)
  const getters: { [key: string]: PropertyDescriptor['get'] } = {}

  for (const [key, { get }] of Object.entries(descriptors)) {
    if (typeof get === 'function') {
      getters[key] = get
    }
  }

  return getters
}

// TODO probably not needed.
export const isGetter = (input: object, property: string | symbol): boolean => {
  const descriptor = Object.getOwnPropertyDescriptor(input, property)
  return !!descriptor && typeof descriptor.get === 'function'
}

export const reevaluateGetter = (target: { [key: string | symbol]: Value }, property: string | symbol) => {
  const temporaryValue = target[property]
  delete target[property]
  target[property] = temporaryValue
  return target[property]
}

export const newProxy = <T extends object>(target: T, handler: ProxyHandler<T>): T => new Proxy(target, handler)

export const canProxy = (x: unknown, refSet: WeakSet<WeakKey>) =>
  isObject(x) &&
  !refSet.has(x) &&
  (Array.isArray(x) || !(Symbol.iterator in x)) &&
  !(x instanceof WeakMap) &&
  !(x instanceof WeakSet) &&
  !(x instanceof Error) &&
  !(x instanceof Number) &&
  !(x instanceof Date) &&
  !(x instanceof String) &&
  !(x instanceof RegExp) &&
  !(x instanceof ArrayBuffer)

export const canPolyfill = (x: unknown) => x instanceof Map || x instanceof Set

export const defaultHandlePromise = <P extends Promise<any>>(
  promise: P & {
    status?: 'pending' | 'fulfilled' | 'rejected'
    value?: Awaited<P>
    reason?: unknown
  },
) => {
  switch (promise.status) {
    case 'fulfilled':
      return promise.value as Awaited<P>
    case 'rejected':
      throw promise.reason
    default:
      throw promise
  }
}

// NOTE copy is required for proper function.
export const createBaseObject = (initialObject: object) => {
  if (Array.isArray(initialObject)) {
    return []
  }

  return Object.create(Object.getPrototypeOf(initialObject))
}

export const snapCache = new WeakMap<object, [version: number, snap: unknown]>()
