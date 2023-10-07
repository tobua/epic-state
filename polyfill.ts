import { state } from './index'

type KeyValRecord<K, V> = [key: K, value: V]

type InternalObjectMap<K, V> = Map<K, V> & {
  data: KeyValRecord<K, V>[]
  toJSON: object
}

export function objectMap<K, V, R>(
  entries?: Iterable<readonly [K, V]> | null,
  parent?: object,
  root?: R,
): Map<K, V> {
  // Separate object referenced in methods, as type inference with this didn't work properly.
  const polyfill = {
    data: Array.from(entries || []) as KeyValRecord<K, V>[],
    has(key) {
      return polyfill.data.some((p) => p[0] === key)
    },
    set(key, value) {
      // TODO transform value to state polyfill.
      const record = polyfill.data.find((p) => p[0] === key)
      if (record) {
        record[1] = value
      } else {
        polyfill.data.push([key, value])
      }
      return polyfill
    },
    get(key) {
      return polyfill.data.find((p) => p[0] === key)?.[1]
    },
    delete(key) {
      const index = polyfill.data.findIndex((p) => p[0] === key)
      if (index === -1) {
        return false
      }
      polyfill.data.splice(index, 1)
      return true
    },
    clear() {
      polyfill.data.splice(0)
    },
    get size() {
      return polyfill.data.length
    },
    toJSON() {
      return new Map(polyfill.data)
    },
    forEach(callback) {
      polyfill.data.forEach((p) => {
        callback(p[1], p[0], polyfill)
      })
    },
    keys() {
      return polyfill.data.map((p) => p[0]).values()
    },
    values() {
      return polyfill.data.map((p) => p[1]).values()
    },
    entries() {
      return new Map(polyfill.data).entries()
    },
    get [Symbol.toStringTag]() {
      return 'Map'
    },
    [Symbol.iterator]() {
      return polyfill.entries()
    },
  }

  const map: InternalObjectMap<K, V> = state(
    polyfill,
    parent,
    root,
  ) as unknown as InternalObjectMap<K, V>

  Object.defineProperties(map, {
    data: {
      enumerable: false,
    },
    size: {
      enumerable: false,
    },
    toJSON: {
      enumerable: false,
    },
  })

  Object.seal(map)

  return map as Map<K, V>
}

// properties that we don't want to expose to the end-user
type InternalObjectSet<T> = Set<T> & {
  data: T[]
  toJSON: object
}

export function objectSet<T, R>(
  initialValues?: Iterable<T> | null,
  parent?: object,
  root?: R,
): Set<T> {
  const polyfill = {
    data: Array.from(new Set(initialValues)),
    has(value) {
      return polyfill.data.indexOf(value) !== -1
    },
    add(value: T) {
      let hasProxy = false
      if (typeof value === 'object' && value !== null) {
        // TODO why is it calling state to check if it has a proxy?
        hasProxy = polyfill.data.indexOf(state(value, polyfill) as T) !== -1
      }
      if (polyfill.data.indexOf(value) === -1 && !hasProxy) {
        polyfill.data.push(value)
      }
      return polyfill
    },
    delete(value) {
      const index = polyfill.data.indexOf(value)
      if (index === -1) {
        return false
      }
      polyfill.data.splice(index, 1)
      return true
    },
    clear() {
      polyfill.data.splice(0)
    },
    get size() {
      return polyfill.data.length
    },
    forEach(cb) {
      polyfill.data.forEach((value) => {
        cb(value, value, polyfill)
      })
    },
    get [Symbol.toStringTag]() {
      return 'Set'
    },
    toJSON() {
      // TODO is a regular Set valid JSON?
      return new Set(polyfill.data)
    },
    [Symbol.iterator]() {
      return polyfill.data[Symbol.iterator]()
    },
    values() {
      return polyfill.data.values()
    },
    keys() {
      // for Set.keys is an alias for Set.values()
      return polyfill.data.values()
    },
    entries() {
      // array.entries returns [index, value] while Set [value, value]
      return new Set(polyfill.data).entries()
    },
  }

  const set: InternalObjectSet<T> = state(polyfill, parent, root) as Set<T> & {
    data: T[]
    toJSON: () => string
  }

  Object.defineProperties(set, {
    data: {
      enumerable: false,
    },
    size: {
      enumerable: false,
    },
    toJSON: {
      enumerable: false,
    },
  })

  Object.seal(set)

  return set as Set<T>
}
